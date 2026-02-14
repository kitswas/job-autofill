import { Profile } from "core";

type StorageData = {
	profiles: Record<string, Profile>;
	selectedProfileId: string | null;
};

const isExtension = typeof chrome !== "undefined" && chrome.storage;

export const storage = {
	get: async (): Promise<StorageData> => {
		if (isExtension) {
			const result = await chrome.storage.sync.get(["profiles", "selectedProfileId"]);
			return {
				profiles: result.profiles || {},
				selectedProfileId: result.selectedProfileId || null,
			};
		} else {
			const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
			const selectedProfileId = localStorage.getItem("selectedProfileId");
			return { profiles, selectedProfileId };
		}
	},
	set: async (data: Partial<StorageData>): Promise<void> => {
		if (isExtension) {
			await chrome.storage.sync.set(data);
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
