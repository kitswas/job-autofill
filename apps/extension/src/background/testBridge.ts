import browser from "webextension-polyfill";
import type { Profile } from "core";
import { standardProfile as mockProfileDefault } from "../../tests/profiles";

type SetupArgs = {
	sendAutofillCommand: (tabId: number, profile: Profile) => Promise<any>;
	mockProfile?: Profile;
	handleCreateProfileFromPage: (tabId: number) => Promise<void> | void;
};

export function setupBackgroundTestBridge(args: SetupArgs) {
	const {
		sendAutofillCommand,
		mockProfile = mockProfileDefault,
		handleCreateProfileFromPage,
	} = args;

	// Expose for debugging in test environment
	(globalThis as any).sendAutofillCommand = sendAutofillCommand;
	(globalThis as any).mockProfile = mockProfile;

	// Ensure there's a mock profile installed for tests
	browser.runtime.onInstalled.addListener(() => {
		browser.storage.sync
			.set({ [`profile_${mockProfile.id}`]: mockProfile })
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

	// Register test message handlers
	browser.runtime.onMessage.addListener((message: any, sender: browser.Runtime.MessageSender) => {
		if (message.type === "TEST_TRIGGER_AUTOFILL") {
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
			if (sender.tab?.id) {
				console.log(
					"[Job Autofill][background] Executing test create-profile for tab:",
					sender.tab.id,
				);
				handleCreateProfileFromPage(sender.tab.id);
				return Promise.resolve({ success: true });
			}
		} else if (message.type === "TEST_GET_PROFILES") {
			return browser.storage.sync
				.get(null)
				.then((allData: Record<string, any>) => {
					const profiles: Record<string, any> = {};
					Object.keys(allData).forEach((k) => {
						if (k.startsWith("profile_")) profiles[k] = allData[k];
					});
					return Promise.resolve({ profiles });
				})
				.catch((err) => {
					console.error("[Job Autofill][background] TEST_GET_PROFILES error:", err);
					return Promise.resolve({ profiles: {} });
				});
		}
	});
}

export default setupBackgroundTestBridge;
