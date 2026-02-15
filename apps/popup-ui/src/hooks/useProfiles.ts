import { useState, useEffect } from "react";
import { Profile, Rule, PROFILE_TEMPLATES, CURRENT_SCHEMA_VERSION } from "core";
import { storage } from "../storage";

function migrateProfile(profile: any): Profile {
	const currentProfile = { ...profile };

	// Future migrations will be added here
	// if (currentProfile.version < 2) {
	//    currentProfile = v1ToV2(currentProfile);
	// }

	currentProfile.version = CURRENT_SCHEMA_VERSION;
	return currentProfile as Profile;
}

export function useProfiles() {
	const [profiles, setProfiles] = useState<Record<string, Profile>>({});
	const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
	const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

	useEffect(() => {
		storage.get().then((data) => {
			if (Object.keys(data.profiles).length === 0) {
				// Prepopulate with templates
				const initialProfiles: Record<string, Profile> = {};
				PROFILE_TEMPLATES.forEach((template) => {
					const id = template.id;
					initialProfiles[id] = {
						version: CURRENT_SCHEMA_VERSION,
						id,
						name: template.name,
						enabledDomains: ["*"],
						rules: template.rules.map((r) => ({
							...r,
							id: Math.random().toString(36).substr(2, 9),
						})),
					};
				});
				saveProfiles(initialProfiles, PROFILE_TEMPLATES[0]?.id || null);
			} else {
				// Migrate existing profiles
				const migratedProfiles: Record<string, Profile> = {};
				Object.entries(data.profiles).forEach(([id, p]) => {
					migratedProfiles[id] = migrateProfile(p);
				});
				setProfiles(migratedProfiles);
				setSelectedProfileId(data.selectedProfileId);
			}
		});
	}, []);

	const saveProfiles = async (
		newProfiles: Record<string, Profile>,
		newSelectedId: string | null,
	) => {
		setProfiles(newProfiles);
		setSelectedProfileId(newSelectedId);
		await storage.set({ profiles: newProfiles, selectedProfileId: newSelectedId });
	};

	const createProfile = () => {
		const newProfile: Profile = {
			version: CURRENT_SCHEMA_VERSION,
			id: Date.now().toString(),
			name: "New Profile",
			enabledDomains: ["*"],
			rules: [
				{
					id: "1",
					name: "full_name",
					content: "",
					keywords: ["name", "full name"],
					type: "contains",
				},
				{
					id: "2",
					name: "email",
					content: "",
					keywords: ["email", "e-mail"],
					type: "contains",
				},
				{
					id: "3",
					name: "phone",
					content: "",
					keywords: ["phone", "mobile"],
					type: "contains",
				},
			],
		};
		setEditingProfile(newProfile);
	};

	const createProfileFrom = (baseProfile: Profile) => {
		const newProfile: Profile = {
			...baseProfile,
			id: Date.now().toString(),
			name: baseProfile.name + " Copy",
		};
		setEditingProfile(newProfile);
	};

	const saveEditingProfile = () => {
		if (!editingProfile) return;
		const newProfiles = { ...profiles, [editingProfile.id]: editingProfile };
		saveProfiles(newProfiles, selectedProfileId || editingProfile.id);
		setEditingProfile(null);
	};

	const deleteProfile = (id: string) => {
		const { [id]: _, ...rest } = profiles;
		saveProfiles(rest, selectedProfileId === id ? null : selectedProfileId);
		if (editingProfile?.id === id) {
			setEditingProfile(null);
		}
	};

	const addRule = () => {
		if (!editingProfile) return;
		const newRule: Rule = {
			id: Date.now().toString(),
			name: `field_${editingProfile.rules.length + 1}`,
			content: "",
			keywords: [],
			type: "contains",
		};
		setEditingProfile({
			...editingProfile,
			rules: [...editingProfile.rules, newRule],
		});
	};

	const updateRule = (id: string, field: keyof Rule, value: any) => {
		if (!editingProfile) return;
		setEditingProfile({
			...editingProfile,
			rules: editingProfile.rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
		});
	};

	const deleteRule = (id: string) => {
		if (!editingProfile) return;
		setEditingProfile({
			...editingProfile,
			rules: editingProfile.rules.filter((r) => r.id !== id),
		});
	};

	const reorderRule = (id: string, direction: "up" | "down") => {
		if (!editingProfile) return;
		const index = editingProfile.rules.findIndex((r) => r.id === id);
		if (index === -1) return;

		const newRules = [...editingProfile.rules];
		const targetIndex = direction === "up" ? index - 1 : index + 1;

		if (targetIndex < 0 || targetIndex >= newRules.length) return;

		[newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];

		setEditingProfile({
			...editingProfile,
			rules: newRules,
		});
	};

	const updateEditingProfile = (updates: Partial<Profile>) => {
		if (!editingProfile) return;
		setEditingProfile({ ...editingProfile, ...updates });
	};

	return {
		profiles,
		selectedProfileId,
		editingProfile,
		setEditingProfile,
		createProfile,
		createProfileFrom,
		saveEditingProfile,
		deleteProfile,
		addRule,
		updateRule,
		deleteRule,
		reorderRule,
		updateEditingProfile,
	};
}
