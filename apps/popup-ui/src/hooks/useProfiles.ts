import { useState, useEffect } from "react";
import { Profile, Mapping } from "core";
import { storage } from "../storage";

export function useProfiles() {
	const [profiles, setProfiles] = useState<Record<string, Profile>>({});
	const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
	const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

	useEffect(() => {
		storage.get().then((data) => {
			setProfiles(data.profiles);
			setSelectedProfileId(data.selectedProfileId);
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
			id: Date.now().toString(),
			name: "New Profile",
			enabledDomains: ["*"],
			mappings: {
				full_name: { content: "", keywords: ["name", "full name"] },
				email: { content: "", keywords: ["email", "e-mail"] },
				phone: { content: "", keywords: ["phone", "mobile"] },
			},
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

	const addMapping = () => {
		if (!editingProfile) return;
		const key = `field_${Date.now()}`;
		setEditingProfile({
			...editingProfile,
			mappings: {
				...editingProfile.mappings,
				[key]: { content: "", keywords: [] },
			},
		});
	};

	const updateMapping = (key: string, field: keyof Mapping, value: string | string[]) => {
		if (!editingProfile) return;
		setEditingProfile({
			...editingProfile,
			mappings: {
				...editingProfile.mappings,
				[key]: { ...editingProfile.mappings[key], [field]: value },
			},
		});
	};

	const deleteMapping = (key: string) => {
		if (!editingProfile) return;
		const { [key]: _, ...rest } = editingProfile.mappings;
		setEditingProfile({ ...editingProfile, mappings: rest });
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
		addMapping,
		updateMapping,
		deleteMapping,
		updateEditingProfile,
	};
}
