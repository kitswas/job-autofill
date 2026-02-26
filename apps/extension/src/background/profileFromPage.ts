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

	snapshot.fields.forEach((field, index) => {
		const label = (
			field.id ||
			field.name ||
			field.placeholder ||
			field.label ||
			field.ariaLabel ||
			""
		).trim();
		if (!label) return;

		const labelLower = label.toLowerCase();
		if (seenLabels.has(labelLower)) return;
		seenLabels.add(labelLower);

		rules.push({
			id: (index + 1).toString(),
			name: label,
			content: "",
			keywords: [labelLower],
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
