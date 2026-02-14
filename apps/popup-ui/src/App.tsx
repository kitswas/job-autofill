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
		addMapping,
		updateMapping,
		deleteMapping,
		updateEditingProfile,
	} = useProfiles();

	return (
		<div style={{ display: "flex", height: "100vh", fontFamily: "system-ui" }}>
			<Sidebar
				profiles={profiles}
				editingProfileId={editingProfile?.id}
				onSelectProfile={setEditingProfile}
				onCreateProfile={createProfile}
			/>

			<div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
				{editingProfile ? (
					<ProfileEditor
						profile={editingProfile}
						onUpdateProfile={updateEditingProfile}
						onSave={saveEditingProfile}
						onDelete={deleteProfile}
						onDuplicate={createProfileFrom}
						onAddMapping={addMapping}
						onUpdateMapping={updateMapping}
						onDeleteMapping={deleteMapping}
					/>
				) : (
					<div style={{ textAlign: "center", marginTop: "100px", color: "#888" }}>
						<h2>Select a profile to edit or create a new one.</h2>
					</div>
				)}
			</div>
		</div>
	);
}
