import browser from "webextension-polyfill";
import { matchFields, Profile, DomSnapshot } from "core";
import { standardProfile as mockProfile } from "../../tests/profiles";

console.log("[Job Autofill][background] script loaded");

// Open dashboard on icon click
browser.action.onClicked.addListener(() => {
	browser.tabs.create({ url: "index.html" });
});

// Update context menus based on profiles
async function updateContextMenus() {
	await browser.contextMenus.removeAll();

	const { profiles } = await browser.storage.sync.get(["profiles"]);
	if (!profiles) return;

	browser.contextMenus.create({
		id: "autofill-root",
		title: "Job Autofill",
		contexts: ["editable"],
	});

	Object.values(profiles as Record<string, Profile>).forEach((profile) => {
		browser.contextMenus.create({
			id: `autofill-profile-${profile.id}`,
			parentId: "autofill-root",
			title: profile.name || "Unnamed Profile",
			contexts: ["editable"],
		});
	});
}

// Initial update
updateContextMenus();

// Watch for profile changes to update menus
browser.storage.onChanged.addListener((changes) => {
	if (changes.profiles) {
		updateContextMenus();
	}
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab?.id || !info.menuItemId.toString().startsWith("autofill-profile-")) return;

	const profileId = info.menuItemId.toString().replace("autofill-profile-", "");
	const { profiles } = await browser.storage.sync.get(["profiles"]);
	if (!profiles) {
		console.error("[Job Autofill][background] No profiles found in storage");
		return;
	}
	const profile = profiles?.[profileId];

	if (!profile) return;
	await sendAutofillCommand(tab.id, profile);
});

async function sendAutofillCommand(tabId: number, profile: Profile) {
	try {
		const response = await browser.tabs.sendMessage(tabId, { type: "GET_DOM_SNAPSHOT" });
		if (!response) {
			console.error("[Job Autofill][background] Received empty response for DOM snapshot");
			return;
		}

		const actions = matchFields(response as DomSnapshot, profile as Profile);
		if (actions.length > 0) {
			await browser.tabs.sendMessage(tabId, { type: "APPLY_ACTIONS", actions });
		}
	} catch (error) {
		console.error(
			"[Job Autofill][background] Failed to get DOM snapshot or apply actions:",
			error,
		);
	}
}

browser.runtime.onMessage.addListener((message, sender) => {
	if (message.type === "ANALYZE_FORM") {
		const { domPayload, profilePayload } = message;
		try {
			const dom = JSON.parse(domPayload);
			const profile = JSON.parse(profilePayload);
			const actions = matchFields(dom, profile);
			return Promise.resolve({ actions });
		} catch (e) {
			console.error("[Job Autofill][background] ANALYZE_FORM error:", e);
			return Promise.resolve({ actions: [] });
		}
	} else if (message.type === "TEST_TRIGGER_AUTOFILL") {
		// --- E2E Test Bridge Handler ---
		if (sender.tab?.id) {
			console.log(
				"[Job Autofill][background] Executing test autofill for tab:",
				sender.tab.id,
			);
			const profileToUse = message.profile || mockProfile;
			sendAutofillCommand(sender.tab.id, profileToUse);
			return Promise.resolve({ success: true });
		}
	}
});

// Test Mode Configuration
if (typeof __TEST_MODE__ !== "undefined" && __TEST_MODE__) {
	(globalThis as any).sendAutofillCommand = sendAutofillCommand;
	(globalThis as any).mockProfile = mockProfile;

	browser.runtime.onInstalled.addListener(async () => {
		await browser.storage.sync.set({
			profiles: { [mockProfile.id]: mockProfile },
		});
		console.log("[Job Autofill][background] Test mode: Mock profile loaded");
	});
}
