import { Profile, STORAGE_SYNC_QUOTA_BYTES, STORAGE_SYNC_QUOTA_BYTES_PER_ITEM } from "core";

type StorageData = {
	profiles: Record<string, Profile>;
	selectedProfileId: string | null;
	hasSeenOnboarding: boolean;
};

export const PROFILE_KEY_PREFIX = "profile_";

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
				const allData = (await browser.storage.sync.get(null)) as Record<string, any>;
				const profiles: Record<string, Profile> = {};
				const selectedProfileId: string | null = allData.selectedProfileId || null;
				const hasSeenOnboarding: boolean = allData.hasSeenOnboarding || false;

				Object.keys(allData).forEach((key) => {
					if (key.startsWith(PROFILE_KEY_PREFIX)) {
						const profileId = key.slice(PROFILE_KEY_PREFIX.length);
						profiles[profileId] = allData[key] as Profile;
					}
				});

				return { profiles, selectedProfileId, hasSeenOnboarding };
			} catch (error) {
				console.error("Error accessing extension storage:", error);
				return { profiles: {}, selectedProfileId: null, hasSeenOnboarding: false };
			}
		} else {
			const profiles: Record<string, Profile> = {};
			const selectedProfileId = localStorage.getItem("selectedProfileId");
			const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding") === "true";

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(PROFILE_KEY_PREFIX)) {
					const profileId = key.slice(PROFILE_KEY_PREFIX.length);
					try {
						profiles[profileId] = JSON.parse(localStorage.getItem(key) || "{}");
					} catch (e) {
						console.error(`Error parsing localStorage profile ${profileId}:`, e);
					}
				}
			}

			return { profiles, selectedProfileId, hasSeenOnboarding };
		}
	},
	set: async (data: Partial<StorageData>): Promise<void> => {
		const browser = await getBrowser();
		if (browser) {
			const itemsToSet: Record<string, any> = {};

			if (data.selectedProfileId !== undefined) {
				itemsToSet.selectedProfileId = data.selectedProfileId;
			}

			if (data.hasSeenOnboarding !== undefined) {
				itemsToSet.hasSeenOnboarding = data.hasSeenOnboarding;
			}

			if (data.profiles) {
				// Get current storage to see what to remove
				const allData = await browser.storage.sync.get(null);
				const existingProfileKeys = Object.keys(allData).filter((key) =>
					key.startsWith(PROFILE_KEY_PREFIX),
				);

				const newProfileKeys = Object.keys(data.profiles).map(
					(id) => `${PROFILE_KEY_PREFIX}${id}`,
				);

				// Keys to remove
				const keysToRemove = existingProfileKeys.filter(
					(key) => !newProfileKeys.includes(key),
				);
				if (keysToRemove.length > 0) {
					await browser.storage.sync.remove(keysToRemove);
				}

				// Keys to set
				Object.entries(data.profiles).forEach(([id, profile]) => {
					itemsToSet[`${PROFILE_KEY_PREFIX}${id}`] = profile;
				});
			}

			return browser.storage.sync.set(itemsToSet).catch((error) => {
				console.error("Error saving to extension storage:", error);
				throw error;
			});
		} else {
			if (data.profiles) {
				// Handle removals in localStorage
				const currentKeys: string[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key?.startsWith(PROFILE_KEY_PREFIX)) {
						currentKeys.push(key);
					}
				}

				const newKeys = Object.keys(data.profiles).map(
					(id) => `${PROFILE_KEY_PREFIX}${id}`,
				);
				currentKeys.forEach((key) => {
					if (!newKeys.includes(key)) {
						localStorage.removeItem(key);
					}
				});

				// Set new values
				Object.entries(data.profiles).forEach(([id, profile]) => {
					localStorage.setItem(`${PROFILE_KEY_PREFIX}${id}`, JSON.stringify(profile));
				});
			}
			if (data.selectedProfileId !== undefined) {
				localStorage.setItem("selectedProfileId", data.selectedProfileId || "");
			}
			if (data.hasSeenOnboarding !== undefined) {
				localStorage.setItem(
					"hasSeenOnboarding",
					data.hasSeenOnboarding ? "true" : "false",
				);
			}
		}
	},
	getUsageForKey: async (
		key: string,
	): Promise<{
		used: number;
	}> => {
		const browser = await getBrowser();
		if (browser) {
			try {
				const used = await browser.storage.sync.getBytesInUse(key);
				return { used: used || 0 };
			} catch (error) {
				console.error("Error getting storage usage for key:", key, error);
				return { used: 0 };
			}
		} else {
			const value = localStorage.getItem(key);
			const used = value ? value.length * 2 : 0; // Approximate size in bytes
			return { used };
		}
	},
	getUsage: async (): Promise<{
		used: number;
		total: number;
		maxPerItem: number;
	}> => {
		const browser = await getBrowser();
		if (browser) {
			try {
				const allData = await browser.storage.sync.get(null);
				const keys = Object.keys(allData);
				const used = (await browser.storage.sync.getBytesInUse(null)) || 0;

				return {
					used,
					total: STORAGE_SYNC_QUOTA_BYTES,
					maxPerItem: STORAGE_SYNC_QUOTA_BYTES_PER_ITEM,
				};
			} catch (error) {
				console.error("Error getting storage usage:", error);
				return {
					used: 0,
					total: STORAGE_SYNC_QUOTA_BYTES,
					maxPerItem: STORAGE_SYNC_QUOTA_BYTES_PER_ITEM,
				};
			}
		} else {
			// Local storage fallback approximation
			let used = 0;
			for (const key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					const size = (localStorage[key] as string).length * 2;
					used += size;
				}
			}
			return {
				used,
				total: STORAGE_SYNC_QUOTA_BYTES,
				maxPerItem: STORAGE_SYNC_QUOTA_BYTES_PER_ITEM,
			};
		}
	},
};
