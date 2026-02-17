import { useProfiles } from "./hooks/useProfiles";
import { Sidebar } from "./components/Sidebar";
import { ProfileEditor } from "./components/ProfileEditor";

export function App() {
	const {
		profiles,
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
	} = useProfiles();

	return (
		<div data-sidebar-layout>
			<Sidebar
				profiles={profiles}
				editingProfileId={editingProfile?.id}
				onSelectProfile={setEditingProfile}
				onCreateProfile={createProfile}
			/>

			<main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
				{editingProfile ? (
					<ProfileEditor
						profile={editingProfile}
						onUpdateProfile={updateEditingProfile}
						onSave={saveEditingProfile}
						onDelete={deleteProfile}
						onDuplicate={createProfileFrom}
						onAddRule={addRule}
						onUpdateRule={updateRule}
						onDeleteRule={deleteRule}
						onReorderRule={reorderRule}
					/>
				) : (
					<div style={{ textAlign: "center", marginTop: "100px", color: "#888" }}>
						<h2>Select a profile to edit or create a new one.</h2>
					</div>
				)}
			</main>
		</div>
	);
}
