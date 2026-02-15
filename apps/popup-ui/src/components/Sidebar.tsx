import { Profile } from "core";

interface SidebarProps {
	profiles: Record<string, Profile>;
	editingProfileId?: string;
	onSelectProfile: (profile: Profile) => void;
	onCreateProfile: () => void;
}

export function Sidebar({
	profiles,
	editingProfileId,
	onSelectProfile,
	onCreateProfile,
}: SidebarProps) {
	return (
		<div
			style={{
				width: "300px",
				borderRight: "1px solid #ccc",
				padding: "20px",
				backgroundColor: "#f9f9f9",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<h2>Profiles</h2>
			<button
				onClick={onCreateProfile}
				style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
			>
				+ Create Profile
			</button>

			<div style={{ flex: 1, overflowY: "auto" }}>
				{Object.values(profiles).map((p) => (
					<div
						key={p.id}
						onClick={() => onSelectProfile(p)}
						style={{
							padding: "10px",
							border: "1px solid #ddd",
							marginBottom: "10px",
							borderRadius: "4px",
							cursor: "pointer",
							backgroundColor: editingProfileId === p.id ? "#e0e0e0" : "white",
						}}
					>
						<strong>{p.name}</strong>
						<div style={{ fontSize: "12px", color: "#666" }}>
							{Array.isArray(p.mappings) ? p.mappings.length : 0} fields
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
