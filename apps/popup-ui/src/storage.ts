import { Profile } from "core";

type StorageData = {
	profiles: Record<string, Profile>;
	selectedProfileId: string | null;
};

// Check if we are running in an extension environment without crashing
const isExtension =
	typeof window !== "undefined" &&
	((window as any).chrome?.storage !== undefined ||
		(window as any).browser?.storage !== undefined);

/**
 * Lazily load the polyfill only when needed and when we know we are in an extension.
 * This prevents "This script should only be loaded in a browser extension" error in dev mode.
 */
async function getBrowser() {
	if (isExtension) {
		const module = await import("webextension-polyfill");
		return module.default;
	}
	return null;
}

export const storage = {
	get: async (): Promise<StorageData> => {
		const browser = await getBrowser();
		if (browser) {
			try {
				const result = await browser.storage.sync.get(["profiles", "selectedProfileId"]);
				return {
					profiles: result.profiles || {},
					selectedProfileId: result.selectedProfileId || null,
				};
			} catch (error) {
				console.error("Error accessing extension storage:", error);
				return { profiles: {}, selectedProfileId: null };
			}
		} else {
			const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
			const selectedProfileId = localStorage.getItem("selectedProfileId");
			return { profiles, selectedProfileId };
		}
	},
	set: async (data: Partial<StorageData>): Promise<void> => {
		const browser = await getBrowser();
		if (browser) {
			try {
				await browser.storage.sync.set(data);
			} catch (error) {
				console.error("Error saving to extension storage:", error);
			}
		} else {
			if (data.profiles) {
				localStorage.setItem("profiles", JSON.stringify(data.profiles));
			}
			if (data.selectedProfileId !== undefined) {
				localStorage.setItem("selectedProfileId", data.selectedProfileId || "");
			}
		}
	},
};
