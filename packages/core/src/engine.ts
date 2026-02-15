import Fuse from "fuse.js";
import { Action, DomSnapshot, Profile, Rule } from "./types";

function calculateScore(
	normalizedText: string,
	normalizedKeyword: string,
	type: Rule["type"],
): number {
	switch (type) {
		case "exact": {
			const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
			return regex.test(normalizedText) ? 100 : 0;
		}
		case "contains":
			return normalizedText.includes(normalizedKeyword) ? 50 : 0;
		case "starts_with":
			return normalizedText.startsWith(normalizedKeyword) ? 30 : 0;
		case "fuzzy": {
			// Basic substring check as a fast path for fuzzy
			if (normalizedText.includes(normalizedKeyword)) return 40;

			const fuse = new Fuse([normalizedText], {
				includeScore: true,
				threshold: 0.4,
			});
			const results = fuse.search(normalizedKeyword);
			if (results.length > 0 && results[0].score !== undefined) {
				return Math.round((1 - results[0].score) * 40);
			}
			return 0;
		}
		default:
			return 0;
	}
}

export function matchFields(dom: DomSnapshot, profile: Profile): Action[] {
	const fieldBestMatches = new Map<string, { action: Action; score: number }>();
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

		for (const rule of profile.rules) {
			const keywords = [rule.name, ...rule.keywords];

			let maxRuleScore = 0;
			for (const keyword of keywords) {
				const normalizedKeyword = keyword
					.replace(/([a-z])([A-Z])/g, "$1 $2")
					.replace(/[_-]/g, " ")
					.replace(/\s+/g, " ")
					.trim()
					.toLowerCase();

				const score = calculateScore(normalizedText, normalizedKeyword, rule.type);
				if (score > maxRuleScore) {
					maxRuleScore = score;
				}
			}

			if (maxRuleScore > 0) {
				const existing = fieldBestMatches.get(selector);
				if (!existing || maxRuleScore >= existing.score) {
					fieldBestMatches.set(selector, {
						action: {
							selector,
							action: "set_value",
							payload: rule.content,
						},
						score: maxRuleScore,
					});
				}
			}
		}
	}

	return Array.from(fieldBestMatches.values()).map((m) => m.action);
}
