import { useState, useEffect } from "react";
import { Profile, Mapping, PROFILE_TEMPLATES } from "core";
import { storage } from "../storage";

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
						id,
						name: template.name,
						enabledDomains: ["*"],
						mappings: template.mappings.map((m) => ({
							...m,
							id: Math.random().toString(36).substr(2, 9),
						})),
					};
				});
				saveProfiles(initialProfiles, PROFILE_TEMPLATES[0]?.id || null);
			} else {
				setProfiles(data.profiles);
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
			id: Date.now().toString(),
			name: "New Profile",
			enabledDomains: ["*"],
			mappings: [
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

	const addMapping = () => {
		if (!editingProfile) return;
		const newMapping: Mapping = {
			id: Date.now().toString(),
			name: `field_${editingProfile.mappings.length + 1}`,
			content: "",
			keywords: [],
			type: "contains",
		};
		setEditingProfile({
			...editingProfile,
			mappings: [...editingProfile.mappings, newMapping],
		});
	};

	const updateMapping = (id: string, field: keyof Mapping, value: any) => {
		if (!editingProfile) return;
		setEditingProfile({
			...editingProfile,
			mappings: editingProfile.mappings.map((m) =>
				m.id === id ? { ...m, [field]: value } : m,
			),
		});
	};

	const deleteMapping = (id: string) => {
		if (!editingProfile) return;
		setEditingProfile({
			...editingProfile,
			mappings: editingProfile.mappings.filter((m) => m.id !== id),
		});
	};

	const reorderMapping = (id: string, direction: "up" | "down") => {
		if (!editingProfile) return;
		const index = editingProfile.mappings.findIndex((m) => m.id === id);
		if (index === -1) return;

		const newMappings = [...editingProfile.mappings];
		const targetIndex = direction === "up" ? index - 1 : index + 1;

		if (targetIndex < 0 || targetIndex >= newMappings.length) return;

		[newMappings[index], newMappings[targetIndex]] = [
			newMappings[targetIndex],
			newMappings[index],
		];

		setEditingProfile({
			...editingProfile,
			mappings: newMappings,
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
		addMapping,
		updateMapping,
		deleteMapping,
		reorderMapping,
		updateEditingProfile,
	};
}
