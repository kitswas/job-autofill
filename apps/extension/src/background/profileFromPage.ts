import browser from "webextension-polyfill";
import {
	DomField,
	DomSnapshot,
	InputType,
	Rule,
	Profile,
	CURRENT_SCHEMA_VERSION,
	MatchType,
} from "core";

// Derive the best InputType for a rule from a DOM field
function deriveInputType(field: DomField): InputType {
	return (field.type?.toLowerCase() as InputType) || "any";
}

// Build a new Profile from a DOM snapshot captured on a page
export function createProfileFromSnapshot(snapshot: DomSnapshot): Profile {
	const id = Date.now().toString();
	let hostname = "";
	try {
		hostname = new URL(snapshot.url).hostname;
	} catch {
		hostname = snapshot.url;
	}

	const seenLabels = new Set<string>();
	const rules: Rule[] = [];

	function normalizeKey(str?: string | null) {
		return (str || "").toString().trim().toLowerCase();
	}

	snapshot.fields.forEach((field, index) => {
		// Prefer human readable labels for the rule name
		const readableLabel = (
			field.label ||
			field.ariaLabel ||
			field.placeholder ||
			field.name ||
			field.id ||
			""
		)
			.toString()
			.trim();
		if (!readableLabel) return;

		const labelKey = normalizeKey(readableLabel);
		if (!labelKey) return;
		if (seenLabels.has(labelKey)) return;
		seenLabels.add(labelKey);

		// Build keywords array with prioritized attributes. Keywords are used
		// for matching, so include multiple fallbacks (label, name, id, placeholder).
		const kwCandidates = [
			field.label,
			field.ariaLabel,
			field.name,
			field.id,
			field.automationId,
		]
			.filter(Boolean)
			.map((s) => s!.toString().trim())
			.filter(Boolean);

		// Deduplicate and lowercase keywords
		const seenKw = new Set<string>();
		const keywords: string[] = [];
		for (const k of kwCandidates) {
			const nk = normalizeKey(k);
			if (!nk) continue;
			if (seenKw.has(nk)) continue;
			seenKw.add(nk);
			keywords.push(k);
		}

		if (keywords.length === 0) return;

		const ruleName = readableLabel || keywords[0] || `field_${index + 1}`;

		rules.push({
			id: (Date.now() + index).toString(),
			name: ruleName,
			content: "",
			keywords,
			matchtype: "fuzzy" as MatchType,
			inputtype: deriveInputType(field),
		});
	});

	return {
		version: CURRENT_SCHEMA_VERSION,
		id,
		name: `Profile from ${hostname || "page"}`,
		enabledDomains: [hostname || "*"],
		rules,
	};
}

// Handle the "Create profile from page" context menu click
export function handleCreateProfileFromPage(tabId: number): void {
	browser.tabs
		.sendMessage(tabId, { type: "GET_DOM_SNAPSHOT" })
		.then((response) => {
			if (!response) {
				console.error(
					"[Job Autofill][background] No DOM snapshot received for profile creation",
				);
				return;
			}
			const profile = createProfileFromSnapshot(response as DomSnapshot);
			return browser.storage.sync.set({ [`profile_${profile.id}`]: profile }).then(() => {
				console.log("[Job Autofill][background] Created profile from page:", profile.id);
				browser.tabs.create({ url: "index.html" });
			});
		})
		.catch((error) => {
			console.error("[Job Autofill][background] Error creating profile from page:", error);
		});
}
