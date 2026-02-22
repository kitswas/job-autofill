import { Profile, STORAGE_SYNC_QUOTA_BYTES, STORAGE_SYNC_QUOTA_BYTES_PER_ITEM } from "core";
import { compress, decompress } from "./storageCompression";

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

interface StorageProvider {
	get(): Promise<StorageData>;
	set(data: Partial<StorageData>): Promise<void>;
	getUsageForKey(key: string): Promise<{ used: number }>;
	getUsage(): Promise<{ used: number; total: number; maxPerItem: number }>;
}

class ExtensionStorageProvider implements StorageProvider {
	constructor(private readonly browser: Awaited<ReturnType<typeof getBrowser>> & object) {}

	async get(): Promise<StorageData> {
		try {
			const allData = (await this.browser.storage.sync.get(null)) as Record<string, any>;
			const profiles: Record<string, Profile> = {};
			const selectedProfileId: string | null = allData.selectedProfileId || null;
			const hasSeenOnboarding: boolean = allData.hasSeenOnboarding || false;

			const profileDecodeJobs = Object.keys(allData)
				.filter((key) => key.startsWith(PROFILE_KEY_PREFIX))
				.map((key) => {
					const profileId = key.slice(PROFILE_KEY_PREFIX.length);
					return decompress<Profile>(allData[key])
						.then((decodedProfile) => {
							profiles[profileId] = decodedProfile;
						})
						.catch((error) => {
							console.error(`Error decoding stored profile ${profileId}:`, error);
						});
				});

			return Promise.all(profileDecodeJobs).then(() => ({
				profiles,
				selectedProfileId,
				hasSeenOnboarding,
			}));
		} catch (error) {
			console.error("Error accessing extension storage:", error);
			return { profiles: {}, selectedProfileId: null, hasSeenOnboarding: false };
		}
	}

	async set(data: Partial<StorageData>): Promise<void> {
		const itemsToSet: Record<string, any> = {};
		let totalSavedPercent = 0;
		let compressedProfiles = 0;
		let profileSyncWork: Promise<void> = Promise.resolve();

		if (data.selectedProfileId !== undefined) {
			itemsToSet.selectedProfileId = data.selectedProfileId;
		}

		if (data.hasSeenOnboarding !== undefined) {
			itemsToSet.hasSeenOnboarding = data.hasSeenOnboarding;
		}

		const profilesData = data.profiles;
		if (profilesData) {
			profileSyncWork = this.browser.storage.sync.get(null).then((allData) => {
				const existingProfileKeys = Object.keys(allData).filter((key) =>
					key.startsWith(PROFILE_KEY_PREFIX),
				);

				const newProfileKeys = Object.keys(profilesData).map(
					(id) => `${PROFILE_KEY_PREFIX}${id}`,
				);

				const keysToRemove = existingProfileKeys.filter(
					(key) => !newProfileKeys.includes(key),
				);
				const removePromise =
					keysToRemove.length > 0
						? this.browser.storage.sync.remove(keysToRemove)
						: Promise.resolve();

				return removePromise.then(() => {
					const profileEntries = Object.entries(profilesData);
					const compressionJobs = profileEntries.map(([id, profile]) => {
						const key = `${PROFILE_KEY_PREFIX}${id}`;

						return compress(profile).then((result) => {
							if (result) {
								itemsToSet[key] = result.data;
								totalSavedPercent += result.savedPercent;
								compressedProfiles++;
								return;
							}

							itemsToSet[key] = profile;
						});
					});

					return Promise.all(compressionJobs).then(() => {
						const total = Object.keys(profilesData).length;
						if (total > 0) {
							const avgSaved =
								compressedProfiles > 0 ? totalSavedPercent / compressedProfiles : 0;
							console.debug(
								`[storage] Compressed ${compressedProfiles}/${total} profiles (avg ${avgSaved.toFixed(1)}% savings)`,
							);
						}
					});
				});
			});
		}

		return profileSyncWork
			.then(() => this.browser.storage.sync.set(itemsToSet))
			.catch((error) => {
				console.error("Error saving to extension storage:", error);
				throw error;
			});
	}

	async getUsageForKey(key: string): Promise<{ used: number }> {
		try {
			const used = await this.browser.storage.sync.getBytesInUse(key);
			return { used: used || 0 };
		} catch (error) {
			console.error("Error getting storage usage for key:", key, error);
			return { used: 0 };
		}
	}

	async getUsage(): Promise<{ used: number; total: number; maxPerItem: number }> {
		try {
			const used = (await this.browser.storage.sync.getBytesInUse(null)) || 0;
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
	}
}

class LocalStorageProvider implements StorageProvider {
	async get(): Promise<StorageData> {
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

	async set(data: Partial<StorageData>): Promise<void> {
		if (data.profiles) {
			// Handle removals in localStorage
			const currentKeys: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(PROFILE_KEY_PREFIX)) {
					currentKeys.push(key);
				}
			}

			const newKeys = Object.keys(data.profiles).map((id) => `${PROFILE_KEY_PREFIX}${id}`);
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
			localStorage.setItem("hasSeenOnboarding", data.hasSeenOnboarding ? "true" : "false");
		}
	}

	async getUsageForKey(key: string): Promise<{ used: number }> {
		const value = localStorage.getItem(key);
		const used = value ? value.length * 2 : 0; // Approximate size in bytes
		return { used };
	}

	async getUsage(): Promise<{ used: number; total: number; maxPerItem: number }> {
		let used = 0;
		for (const key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				used += (localStorage[key] as string).length * 2;
			}
		}
		return {
			used,
			total: STORAGE_SYNC_QUOTA_BYTES,
			maxPerItem: STORAGE_SYNC_QUOTA_BYTES_PER_ITEM,
		};
	}
}

let providerPromise: Promise<StorageProvider> | null = null;

function getProvider(): Promise<StorageProvider> {
	if (!providerPromise) {
		providerPromise = getBrowser().then((browser) =>
			browser ? new ExtensionStorageProvider(browser) : new LocalStorageProvider(),
		);
	}
	return providerPromise;
}

export const storage: StorageProvider = {
	get: async () => (await getProvider()).get(),
	set: async (data) => (await getProvider()).set(data),
	getUsageForKey: async (key) => (await getProvider()).getUsageForKey(key),
	getUsage: async () => (await getProvider()).getUsage(),
};
