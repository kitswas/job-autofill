import Fuse from "fuse.js";
import { Action, DomSnapshot, Profile, Rule } from "./types";
import { MATCH_SCORES, FUZZY_THRESHOLD, REGEX } from "./constants";

/**
 * Normalizes text for matching by removing special characters, handling camelCase,
 * and converting to lowercase.
 */
function normalizeText(text: string | null): string {
	if (!text) return "";
	return text
		.replace(REGEX.CAMEL_CASE, "$1 $2")
		.replace(REGEX.SPECIAL_CHARS, " ")
		.replace(REGEX.PARENTHESES, "")
		.replace(REGEX.WHITESPACE, " ")
		.trim()
		.toLowerCase();
}

interface PreprocessedRule {
	rule: Rule;
	normalizedKeywords: string[];
}

export function matchFields(dom: DomSnapshot, profile: Profile): Action[] {
	const fieldBestMatches = new Map<string, { action: Action; score: number }>();
	const hostname = new URL(dom.url).hostname;

	// 1. Check if profile is enabled for this domain
	const isEnabled = profile.enabledDomains.some((domain) => {
		if (domain === "*") return true;
		return hostname === domain || hostname.endsWith(`.${domain}`);
	});

	if (!isEnabled) return [];

	// 2. Pre-process rules: Normalize keywords once
	const preprocessedRules: PreprocessedRule[] = profile.rules.map((rule) => ({
		rule,
		normalizedKeywords: [rule.name, ...rule.keywords].map(normalizeText).filter(Boolean),
	}));

	// 3. Process fields
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

		const normalizedFieldText = normalizeText(rawText);
		if (!normalizedFieldText) continue;

		const selector = field.id
			? `[id="${field.id}"]`
			: field.name
				? `[name="${field.name}"]`
				: field.automationId
					? `[data-automation-id="${field.automationId}"]`
					: null;

		if (!selector) continue;

		// One Fuse instance per field to avoid redundant initializations
		const fieldFuse = new Fuse([normalizedFieldText], {
			includeScore: true,
			threshold: FUZZY_THRESHOLD,
		});

		// 4. Match against preprocessed rules
		for (const { rule, normalizedKeywords } of preprocessedRules) {
			// Type compatibility check
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

			let maxRuleScore = 0;

			for (const kw of normalizedKeywords) {
				let score = 0;
				switch (rule.matchtype) {
					case "exact": {
						const escapedKeyword = kw.replace(REGEX.ESCAPE_REGEX, "\\$&");
						const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
						if (regex.test(normalizedFieldText)) score = MATCH_SCORES.EXACT;
						break;
					}
					case "contains":
						if (normalizedFieldText.includes(kw)) score = MATCH_SCORES.CONTAINS;
						break;
					case "starts_with":
						if (normalizedFieldText.startsWith(kw)) score = MATCH_SCORES.STARTS_WITH;
						break;
					case "fuzzy": {
						if (normalizedFieldText.includes(kw)) {
							score = MATCH_SCORES.FUZZY_SUBSTRING;
						} else {
							const results = fieldFuse.search(kw);
							if (results.length > 0 && results[0].score !== undefined) {
								score = Math.round(
									(1 - results[0].score) * MATCH_SCORES.FUZZY_BASE,
								);
							}
						}
						break;
					}
				}
				if (score > maxRuleScore) maxRuleScore = score;
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
