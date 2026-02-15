import Fuse from "fuse.js";
import { Action, DomSnapshot, Profile, Rule } from "./types";

function calculateScore(
	normalizedText: string,
	normalizedKeyword: string,
	type: Rule["matchtype"],
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
			// Filter by inputtype compatibility
			if (rule.inputtype !== "any") {
				const isSelect =
					field.kind === "select" ||
					field.type === "select-one" ||
					field.type === "select-multiple";
				const isNumber = field.type === "number" || field.type === "range";
				const isDate =
					field.type === "date" ||
					field.type === "month" ||
					field.type === "week" ||
					field.type === "time" ||
					field.type === "datetime-local";
				const isText =
					field.kind === "textarea" ||
					(field.kind === "input" &&
						[
							"text",
							"email",
							"tel",
							"url",
							"password",
							"search",
							"number",
							"date",
						].includes(field.type || "text"));

				const t = field.type;
				const k = field.kind;

				if (rule.inputtype === "text" && !isText) continue;
				if (rule.inputtype === "textarea" && k !== "textarea") continue;
				if (rule.inputtype === "select" && !isSelect && k !== "input") continue;
				if (rule.inputtype === "multiselect" && t !== "select-multiple" && k !== "input")
					continue;
				if (rule.inputtype === "number" && t !== "number" && k !== "input") continue;
				if (rule.inputtype === "date" && t !== "date" && k !== "input") continue;
				if (rule.inputtype === "spinbox" && k !== "input") continue;
				if (rule.inputtype === "checkbox" && t !== "checkbox") continue;
				if (rule.inputtype === "radio" && t !== "radio") continue;
				if (rule.inputtype === "email" && t !== "email") continue;
				if (rule.inputtype === "tel" && t !== "tel") continue;
				if (rule.inputtype === "url" && t !== "url") continue;
				if (rule.inputtype === "password" && t !== "password") continue;
				if (rule.inputtype === "range" && t !== "range") continue;
				if (rule.inputtype === "file" && t !== "file") continue;
				if (rule.inputtype === "time" && t !== "time") continue;
				if (rule.inputtype === "datetime-local" && t !== "datetime-local") continue;
			}

			const keywords = [rule.name, ...rule.keywords];

			let maxRuleScore = 0;
			for (const keyword of keywords) {
				const normalizedKeyword = keyword
					.replace(/([a-z])([A-Z])/g, "$1 $2")
					.replace(/[_-]/g, " ")
					.replace(/\s+/g, " ")
					.trim()
					.toLowerCase();

				const score = calculateScore(normalizedText, normalizedKeyword, rule.matchtype);
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
							inputtype: rule.inputtype,
						},
						score: maxRuleScore,
					});
				}
			}
		}
	}

	return Array.from(fieldBestMatches.values()).map((m) => m.action);
}
