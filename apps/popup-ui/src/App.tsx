import { useState, useEffect } from "react";
import { Profile, Mapping } from "core";
import { storage } from "./storage";

export function App() {
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

	const saveEditingProfile = () => {
		if (!editingProfile) return;
		const newProfiles = { ...profiles, [editingProfile.id]: editingProfile };
		saveProfiles(newProfiles, selectedProfileId || editingProfile.id);
		setEditingProfile(null);
	};

	const deleteProfile = (id: string) => {
		const { [id]: _, ...rest } = profiles;
		saveProfiles(rest, selectedProfileId === id ? null : selectedProfileId);
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

	return (
		<div style={{ display: "flex", height: "100vh", fontFamily: "system-ui" }}>
			{/* Sidebar */}
			<div
				style={{
					width: "300px",
					borderRight: "1px solid #ccc",
					padding: "20px",
					backgroundColor: "#f9f9f9",
				}}
			>
				<h2>Profiles</h2>
				<button
					onClick={createProfile}
					style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
				>
					+ Create Profile
				</button>
				{Object.values(profiles).map((p) => (
					<div
						key={p.id}
						onClick={() => setEditingProfile(p)}
						style={{
							padding: "10px",
							border: "1px solid #ddd",
							marginBottom: "10px",
							borderRadius: "4px",
							cursor: "pointer",
							backgroundColor: editingProfile?.id === p.id ? "#e0e0e0" : "white",
						}}
					>
						<strong>{p.name}</strong>
						<div style={{ fontSize: "12px", color: "#666" }}>
							{Object.keys(p.mappings).length} fields
						</div>
					</div>
				))}
			</div>

			{/* Main Content */}
			<div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
				{editingProfile ? (
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
								<button
									onClick={() => deleteProfile(editingProfile.id)}
									style={{ marginRight: "10px", color: "red" }}
								>
									Delete Profile
								</button>
								<button
									onClick={saveEditingProfile}
									style={{ padding: "8px 20px", fontWeight: "bold" }}
								>
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
								value={editingProfile.name}
								onChange={(e) =>
									setEditingProfile({ ...editingProfile, name: e.target.value })
								}
								style={{ width: "100%", padding: "8px", marginTop: "5px" }}
							/>
							<br />
							<br />
							<label>Enabled Domains (comma separated, use * for all):</label>
							<br />
							<input
								type="text"
								value={editingProfile.enabledDomains.join(", ")}
								onChange={(e) =>
									setEditingProfile({
										...editingProfile,
										enabledDomains: e.target.value
											.split(",")
											.map((s) => s.trim()),
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
								<button onClick={addMapping}>+ Add Field</button>
							</div>
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr
										style={{
											textAlign: "left",
											borderBottom: "2px solid #eee",
										}}
									>
										<th style={{ padding: "10px" }}>
											Field Identifier / Keywords
										</th>
										<th style={{ padding: "10px" }}>Content to Fill</th>
										<th style={{ padding: "10px" }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(editingProfile.mappings).map(
										([key, mapping]) => (
											<tr
												key={key}
												style={{ borderBottom: "1px solid #eee" }}
											>
												<td style={{ padding: "10px" }}>
													<input
														type="text"
														placeholder="Keywords (comma separated)"
														value={mapping.keywords.join(", ")}
														onChange={(e) =>
															updateMapping(
																key,
																"keywords",
																e.target.value
																	.split(",")
																	.map((s) => s.trim()),
															)
														}
														style={{ width: "90%", padding: "5px" }}
													/>
													<div
														style={{ fontSize: "10px", color: "#888" }}
													>
														ID: {key}
													</div>
												</td>
												<td style={{ padding: "10px" }}>
													<textarea
														value={mapping.content}
														onChange={(e) =>
															updateMapping(
																key,
																"content",
																e.target.value,
															)
														}
														style={{
															width: "90%",
															padding: "5px",
															height: "40px",
														}}
													/>
												</td>
												<td style={{ padding: "10px" }}>
													<button onClick={() => deleteMapping(key)}>
														Remove
													</button>
												</td>
											</tr>
										),
									)}
								</tbody>
							</table>
						</section>
					</div>
				) : (
					<div style={{ textAlign: "center", marginTop: "100px", color: "#888" }}>
						<h2>Select a profile to edit or create a new one.</h2>
					</div>
				)}
			</div>
		</div>
	);
}
