import { Action, DomSnapshot, Profile } from "./types";

export function matchFields(dom: DomSnapshot, profile: Profile): Action[] {
	const actions: Action[] = [];
	const hostname = new URL(dom.url).hostname;

	// Check if profile is enabled for this domain
	const isEnabled = profile.enabledDomains.some(domain => {
		if (domain === "*") return true;
		return hostname.endsWith(domain);
	});

	if (!isEnabled) return [];

	for (const field of dom.fields) {
		if (!["input", "textarea", "select"].includes(field.kind)) {
			continue;
		}

		const fieldText = [
			field.label,
			field.placeholder,
			field.name,
			field.id
		].filter(Boolean).join(" ").toLowerCase();

		// Iterate through all mappings in the profile
		for (const [fieldName, mapping] of Object.entries(profile.mappings)) {
			const keywords = [fieldName, ...mapping.keywords].map(k => k.toLowerCase());
			
			const isMatch = keywords.some(keyword => fieldText.includes(keyword));

			if (isMatch) {
				const selector = field.id ? `#${field.id}` : field.name ? `[name="${field.name}"]` : null;
				if (selector) {
					actions.push({
						selector,
						action: "set_value",
						payload: mapping.content
					});
					break; // Move to next field once matched
				}
			}
		}
	}

	return actions;
}
