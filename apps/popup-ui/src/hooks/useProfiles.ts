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
	const [confirmConfig, setConfirmConfig] = useState<{
		title: string;
		description: string;
		onConfirm: () => void;
	} | null>(null);

	const showConfirm = (config: { title: string; description: string; onConfirm: () => void }) => {
		setConfirmConfig(config);
		const dialog = document.getElementById("confirm-dialog") as HTMLDialogElement;
		if (dialog) {
			dialog.showModal();
		}
	};

	useEffect(() => {
		storage.get().then((data) => {
			if (Object.keys(data.profiles).length === 0) {
				// Prepopulate with templates
				const initialProfiles: Record<string, Profile> = {};
				PROFILE_TEMPLATES.forEach((template) => {
					const id = template.id;
					initialProfiles[id] = { ...template };
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
					matchtype: "contains",
					inputtype: "any",
				},
				{
					id: "2",
					name: "email",
					content: "",
					keywords: ["email", "e-mail"],
					matchtype: "contains",
					inputtype: "any",
				},
				{
					id: "3",
					name: "phone",
					content: "",
					keywords: ["phone", "mobile"],
					matchtype: "contains",
					inputtype: "any",
				},
			],
		};
		setEditingProfile(newProfile);
		window.ot.toast("New profile created.", "Success", { variant: "success" });
	};

	const createProfileFrom = (baseProfile: Profile) => {
		const newProfile: Profile = {
			...baseProfile,
			id: Date.now().toString(),
			name: baseProfile.name + " Copy",
		};
		setEditingProfile(newProfile);
		window.ot.toast("Profile duplicated.", "Success", { variant: "success" });
	};

	const saveEditingProfile = () => {
		if (!editingProfile) return;
		const newProfiles = { ...profiles, [editingProfile.id]: editingProfile };
		saveProfiles(newProfiles, selectedProfileId || editingProfile.id);
		setEditingProfile(null);
		window.ot.toast("Profile saved successfully.", "Success", { variant: "success" });
	};

	const deleteProfile = (id: string) => {
		showConfirm({
			title: "Delete Profile",
			description:
				"Are you sure you want to delete this profile? This action cannot be undone.",
			onConfirm: () => {
				const { [id]: _, ...rest } = profiles;
				saveProfiles(rest, selectedProfileId === id ? null : selectedProfileId);
				if (editingProfile?.id === id) {
					setEditingProfile(null);
				}
				window.ot.toast("Profile deleted.", "Success", { variant: "success" });
			},
		});
	};

	const confirmAction = () => {
		const config = confirmConfig;
		setConfirmConfig(null);
		config?.onConfirm();
	};

	const cancelAction = () => {
		setConfirmConfig(null);
	};

	const addRule = () => {
		if (!editingProfile) return;
		const newRule: Rule = {
			id: Date.now().toString(),
			name: `field_${editingProfile.rules.length + 1}`,
			content: "",
			keywords: [],
			matchtype: "contains",
			inputtype: "any",
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
		showConfirm({
			title: "Remove Field",
			description: "Are you sure you want to remove this autofill field?",
			onConfirm: () => {
				setEditingProfile({
					...editingProfile,
					rules: editingProfile.rules.filter((r) => r.id !== id),
				});
				window.ot.toast("Field removed.", "Success", { variant: "success" });
			},
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
		confirmAction,
		cancelAction,
		confirmConfig,
		addRule,
		updateRule,
		deleteRule,
		reorderRule,
		updateEditingProfile,
	};
}
