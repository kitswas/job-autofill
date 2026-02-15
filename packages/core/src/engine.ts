import Fuse from "fuse.js";
import { Action, DomSnapshot, Profile, Rule } from "./types";

function isMatch(normalizedText: string, normalizedKeyword: string, type: Rule["type"]): boolean {
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
				threshold: 0.4,
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

		const rawText = [
			field.label,
			field.ariaLabel,
			field.placeholder,
			field.name,
			field.id,
			field.automationId,
		]
			.filter(Boolean)
			.join(" ");

		// Normalize text: replace underscores, hyphens, and camelCase with spaces, then collapse spaces
		const normalizedText = rawText
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.replace(/[_-]/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.toLowerCase();

		const selector = field.id
			? `[id="${field.id}"]`
			: field.name
				? `[name="${field.name}"]`
				: field.automationId
					? `[data-automation-id="${field.automationId}"]`
					: null;

		if (!selector) continue;

		// Iterate through all rules in the profile
		// Later rules overwrite earlier ones, so we just let them overwrite in the map
		for (const rule of profile.rules) {
			const keywords = [rule.name, ...rule.keywords];

			const matched = keywords.some((keyword) => {
				const normalizedKeyword = keyword
					.replace(/([a-z])([A-Z])/g, "$1 $2")
					.replace(/[_-]/g, " ")
					.replace(/\s+/g, " ")
					.trim()
					.toLowerCase();
				return isMatch(normalizedText, normalizedKeyword, rule.type);
			});

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
