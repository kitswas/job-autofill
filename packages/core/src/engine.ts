import Fuse from "fuse.js";
import { Action, DomSnapshot, Profile, Rule } from "./types";

function isMatch(text: string, keyword: string, type: Rule["type"]): boolean {
	const normalizedText = text.toLowerCase();
	const normalizedKeyword = keyword.toLowerCase();

	switch (type) {
		case "exact": {
			const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
			return regex.test(normalizedText);
		}
		case "contains":
			return normalizedText.includes(normalizedKeyword);
		case "starts_with":
			return normalizedText.startsWith(normalizedKeyword);
		case "fuzzy": {
			const fuse = new Fuse([normalizedText], {
				includeScore: true,
				threshold: 0.4, // Adjust threshold for better fuzzy matching
			});
			const results = fuse.search(normalizedKeyword);
			return results.length > 0;
		}
		default:
			return false;
	}
}

export function matchFields(dom: DomSnapshot, profile: Profile): Action[] {
	const actionsMap = new Map<string, Action>();
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

		const selector = field.id ? `#${field.id}` : field.name ? `[name="${field.name}"]` : null;

		if (!selector) continue;

		// Iterate through all rules in the profile
		// Later rules overwrite earlier ones, so we just let them overwrite in the map
		for (const rule of profile.rules) {
			const keywords = [rule.name, ...rule.keywords];

			const matched = keywords.some((keyword) => isMatch(normalizedText, keyword, rule.type));

			if (matched) {
				actionsMap.set(selector, {
					selector,
					action: "set_value",
					payload: rule.content,
				});
			}
		}
	}

	return Array.from(actionsMap.values());
}
