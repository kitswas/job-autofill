import browser from "webextension-polyfill";
import { matchFields, Profile, DomSnapshot } from "core";
import { handleCreateProfileFromPage } from "./profileFromPage";
import { standardProfile as mockProfile } from "../../tests/profiles";

console.log("[Job Autofill][background] script loaded");

// Open dashboard on icon click
browser.action.onClicked.addListener(() => {
	browser.tabs.create({ url: "index.html" });
});

// Update context menus based on profiles
function updateContextMenus() {
	browser.contextMenus
		.removeAll()
		.then(() => {
			return browser.storage.sync.get(null);
		})
		.then((allData: Record<string, any>) => {
			const profiles: Record<string, Profile> = {};
			Object.keys(allData).forEach((key) => {
				if (key.startsWith("profile_")) {
					const id = key.slice(8); // "profile_".length
					profiles[id] = allData[key] as Profile;
				}
			});

			browser.contextMenus.create({
				id: "autofill-root",
				title: "Job Autofill",
				contexts: ["all"],
			});

			browser.contextMenus.create({
				id: "create-profile-from-page",
				parentId: "autofill-root",
				title: "Create profile from page",
				contexts: ["all"],
			});

			if (Object.keys(profiles).length > 0) {
				browser.contextMenus.create({
					id: "autofill-profiles-separator",
					parentId: "autofill-root",
					type: "separator",
					contexts: ["all"],
				});

				Object.values(profiles).forEach((profile) => {
					browser.contextMenus.create({
						id: `autofill-profile-${profile.id}`,
						parentId: "autofill-root",
						title: profile.name || "Unnamed Profile",
						contexts: ["all"],
					});
				});
			}
		})
		.catch((error) => {
			console.error("[Job Autofill][background] Error updating context menus:", error);
		});
}

// Initial update
updateContextMenus();

// Onboarding and updates
browser.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		browser.tabs.create({ url: "index.html" });
	} else if (details.reason === "update") {
		const currentVersion = browser.runtime.getManifest().version;
		const previousVersion = details.previousVersion;
		console.info(
			`[Job Autofill][background] Updated from ${previousVersion} to ${currentVersion}`,
		);
		// Optional: Show a "What's New" notification or page
	}
});

// Watch for profile changes to update menus
browser.storage.onChanged.addListener((changes) => {
	const hasProfileChanges = Object.keys(changes).some((key) => key.startsWith("profile_"));
	if (hasProfileChanges) {
		updateContextMenus();
	}
});

browser.contextMenus.onClicked.addListener((info, tab) => {
	if (!tab?.id) return;

	const menuItemId = info.menuItemId.toString();
	const tabId = tab.id;

	if (menuItemId === "create-profile-from-page") {
		handleCreateProfileFromPage(tabId);
		return;
	}

	if (!menuItemId.startsWith("autofill-profile-")) return;

	const profileId = menuItemId.replace("autofill-profile-", "");
	browser.storage.sync
		.get([`profile_${profileId}`])
		.then((result) => {
			const profile = result[`profile_${profileId}`] as Profile;
			if (!profile) {
				console.error(
					"[Job Autofill][background] Profile not found in storage:",
					profileId,
				);
				return;
			}
			return sendAutofillCommand(tabId, profile);
		})
		.catch((error) => {
			console.error("[Job Autofill][background] Error handling context menu click:", error);
		});
});

async function sendAutofillCommand(tabId: number, profile: Profile) {
	return browser.tabs
		.sendMessage(tabId, { type: "GET_DOM_SNAPSHOT" })
		.then((response) => {
			if (!response) {
				console.error(
					"[Job Autofill][background] Received empty response for DOM snapshot",
				);
				return;
			}

			const actions = matchFields(response as DomSnapshot, profile as Profile);
			if (actions.length > 0) {
				return browser.tabs
					.sendMessage(tabId, { type: "APPLY_ACTIONS", actions })
					.catch((error) => {
						console.error(
							"[Job Autofill][background] Failed to send APPLY_ACTIONS message:",
							error,
						);
					});
			}
		})
		.catch((error) => {
			console.error("[Job Autofill][background] Failed to get DOM snapshot:", error);
		});
}

browser.runtime.onMessage.addListener((message: any, sender: browser.Runtime.MessageSender) => {
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
	} else if (message.type === "TEST_TRIGGER_CREATE_PROFILE") {
		// --- E2E Test Bridge Handler ---
		if (sender.tab?.id) {
			console.log(
				"[Job Autofill][background] Executing test create-profile for tab:",
				sender.tab.id,
			);
			handleCreateProfileFromPage(sender.tab.id);
			return Promise.resolve({ success: true });
		}
	}
});

// Test Mode Configuration
if (typeof __TEST_MODE__ !== "undefined" && __TEST_MODE__) {
	(globalThis as any).sendAutofillCommand = sendAutofillCommand;
	(globalThis as any).mockProfile = mockProfile;

	browser.runtime.onInstalled.addListener(() => {
		browser.storage.sync
			.set({
				[`profile_${mockProfile.id}`]: mockProfile,
			})
			.then(() => {
				console.log("[Job Autofill][background] Test mode: Mock profile loaded");
			})
			.catch((error) => {
				console.error(
					"[Job Autofill][background] Error loading mock profile in test mode:",
					error,
				);
			});
	});
}
