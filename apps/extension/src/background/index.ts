import { matchFields, Profile, DomSnapshot } from "core";

console.log('[Job Autofill][background] script loaded');

// Open dashboard on icon click
chrome.action.onClicked.addListener(() => {
	chrome.tabs.create({ url: 'index.html' });
});

// Update context menus based on profiles
async function updateContextMenus() {
	await chrome.contextMenus.removeAll();
	
	const { profiles } = await chrome.storage.sync.get(['profiles']);
	if (!profiles) return;

	chrome.contextMenus.create({
		id: "autofill-root",
		title: "Job Autofill",
		contexts: ["editable"]
	});

	Object.values(profiles as Record<string, Profile>).forEach((profile) => {
		chrome.contextMenus.create({
			id: `autofill-profile-${profile.id}`,
			parentId: "autofill-root",
			title: profile.name || "Unnamed Profile",
			contexts: ["editable"]
		});
	});
}

// Initial update
updateContextMenus();

// Watch for profile changes to update menus
chrome.storage.onChanged.addListener((changes) => {
	if (changes.profiles) {
		updateContextMenus();
	}
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab?.id || !info.menuItemId.toString().startsWith("autofill-profile-")) return;

	const profileId = info.menuItemId.toString().replace("autofill-profile-", "");
	const { profiles } = await chrome.storage.sync.get(['profiles']);
	const profile = profiles?.[profileId];

	if (!profile) return;

	// Request DOM snapshot from content script
	chrome.tabs.sendMessage(tab.id, { type: "GET_DOM_SNAPSHOT" }, (response) => {
		if (chrome.runtime.lastError || !response) {
			console.error('[Job Autofill][background] Failed to get DOM snapshot:', chrome.runtime.lastError);
			return;
		}

		const actions = matchFields(response as DomSnapshot, profile as Profile);
		if (actions.length > 0) {
			chrome.tabs.sendMessage(tab.id, { type: "APPLY_ACTIONS", actions });
		}
	});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "ANALYZE_FORM") {
		const { domPayload, profilePayload } = message;
		try {
			const dom = JSON.parse(domPayload);
			const profile = JSON.parse(profilePayload);
			const actions = matchFields(dom, profile);
			sendResponse({ actions });
		} catch (e) {
			console.error('[Job Autofill][background] ANALYZE_FORM error:', e);
			sendResponse({ actions: [] });
		}
		return true;
	}
});
