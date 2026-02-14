import { Action, DomSnapshot, Profile } from "./types";

export function matchFields(dom: DomSnapshot, profile: Profile): Action[] {
	const actions: Action[] = [];
	const hostname = new URL(dom.url).hostname;

	// Check if profile is enabled for this domain
	const isEnabled = profile.enabledDomains.some((domain) => {
		if (domain === "*") return true;
		return hostname === domain || hostname.endsWith(`.${domain}`);
	});

	if (!isEnabled) return [];

	for (const field of dom.fields) {
		if (!["input", "textarea", "select"].includes(field.kind)) {
			continue;
		}

		const rawText = [field.label, field.placeholder, field.name, field.id]
			.filter(Boolean)
			.join(" ");

		// Normalize text: replace underscores, hyphens, and camelCase with spaces
		const normalizedText = rawText
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.replace(/[_-]/g, " ")
			.toLowerCase();

		// Iterate through all mappings in the profile
		for (const [fieldName, mapping] of Object.entries(profile.mappings)) {
			const keywords = [fieldName, ...mapping.keywords].map((k) => k.toLowerCase());

			const isMatch = keywords.some((keyword) => {
				// Escape keyword for regex and use word boundaries
				const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
				return regex.test(normalizedText);
			});

			if (isMatch) {
				const selector = field.id
					? `#${field.id}`
					: field.name
						? `[name="${field.name}"]`
						: null;
				if (selector) {
					actions.push({
						selector,
						action: "set_value",
						payload: mapping.content,
					});
					break; // Move to next field once matched
				}
			}
		}
	}

	return actions;
}
