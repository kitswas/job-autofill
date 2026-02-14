import { Profile, Mapping } from "core";
import { MappingTable } from "./MappingTable";

interface ProfileEditorProps {
	profile: Profile;
	onUpdateProfile: (updates: Partial<Profile>) => void;
	onSave: () => void;
	onDelete: (id: string) => void;
	onDuplicate: (profile: Profile) => void;
	onAddMapping: () => void;
	onUpdateMapping: (key: string, field: keyof Mapping, value: string | string[]) => void;
	onDeleteMapping: (key: string) => void;
}

export function ProfileEditor({
	profile,
	onUpdateProfile,
	onSave,
	onDelete,
	onDuplicate,
	onAddMapping,
	onUpdateMapping,
	onDeleteMapping,
}: ProfileEditorProps) {
	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<h1>Edit Profile</h1>
				<div>
					<button onClick={() => onDuplicate(profile)} style={{ marginRight: "10px" }}>
						Duplicate
					</button>
					<button
						onClick={() => onDelete(profile.id)}
						style={{
							marginRight: "10px",
							backgroundColor: "red",
							color: "white",
							border: "none",
							padding: "8px 15px",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Delete Profile
					</button>
					<button onClick={onSave} style={{ padding: "8px 20px", fontWeight: "bold" }}>
						Save Changes
					</button>
				</div>
			</div>

			<section style={{ marginBottom: "30px" }}>
				<h3>Basic Info</h3>
				<label>Profile Name:</label>
				<br />
				<input
					type="text"
					value={profile.name}
					onChange={(e) => onUpdateProfile({ name: e.target.value })}
					style={{ width: "100%", padding: "8px", marginTop: "5px" }}
				/>
				<br />
				<br />
				<label>Enabled Domains (comma separated, use * for all):</label>
				<br />
				<input
					type="text"
					value={profile.enabledDomains.join(", ")}
					onChange={(e) =>
						onUpdateProfile({
							enabledDomains: e.target.value.split(",").map((s) => s.trim()),
						})
					}
					style={{ width: "100%", padding: "8px", marginTop: "5px" }}
				/>
			</section>

			<section>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<h3>Field Mappings</h3>
					<button onClick={onAddMapping}>+ Add Field</button>
				</div>
				<MappingTable
					mappings={profile.mappings}
					onUpdateMapping={onUpdateMapping}
					onDeleteMapping={onDeleteMapping}
				/>
			</section>
		</div>
	);
}
