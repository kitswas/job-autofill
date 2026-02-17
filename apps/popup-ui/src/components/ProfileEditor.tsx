import { Profile, Rule } from "core";
import { RuleTable } from "./RuleTable";

interface ProfileEditorProps {
	profile: Profile;
	onUpdateProfile: (updates: Partial<Profile>) => void;
	onSave: () => void;
	onDelete: (id: string) => void;
	onDuplicate: (profile: Profile) => void;
	onAddRule: () => void;
	onUpdateRule: (id: string, field: keyof Rule, value: any) => void;
	onDeleteRule: (id: string) => void;
	onReorderRule: (id: string, direction: "up" | "down") => void;
}

export function ProfileEditor({
	profile,
	onUpdateProfile,
	onSave,
	onDelete,
	onDuplicate,
	onAddRule,
	onUpdateRule,
	onDeleteRule,
	onReorderRule,
}: ProfileEditorProps) {
	return (
		<div>
			<header>
				<h2>Edit Profile</h2>
				<div
					className="buttons gap-2"
					style={{ display: "flex", justifyContent: "flex-end" }}
				>
					<button onClick={() => onDuplicate(profile)} data-variant="secondary">
						Duplicate
					</button>
					<button onClick={() => onDelete(profile.id)} data-variant="danger">
						Delete Profile
					</button>
					<button onClick={onSave}>Save Changes</button>
				</div>
			</header>

			<section style={{ marginBottom: "2rem" }}>
				<h4>Basic Info</h4>
				<label data-field>
					Profile Name
					<input
						type="text"
						value={profile.name}
						onChange={(e) => onUpdateProfile({ name: e.target.value })}
						placeholder="My Profile"
					/>
				</label>
				<label data-field>
					Enabled Domains (comma separated, use * for all)
					<input
						type="text"
						value={profile.enabledDomains.join(", ")}
						onChange={(e) =>
							onUpdateProfile({
								enabledDomains: e.target.value.split(",").map((s) => s.trim()),
							})
						}
						placeholder="example.com, *"
					/>
				</label>
			</section>

			<section>
				<header
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "1rem",
					}}
				>
					<div>
						<h4>Autofill Rules</h4>
						<p style={{ opacity: 0.7, fontSize: "0.8rem", marginTop: "-0.5rem" }}>
							Rules are applied in order, with later rules overwriting earlier ones.
						</p>
					</div>
					<button type="button" onClick={onAddRule} data-variant="primary">
						+ Add Field
					</button>
				</header>
				<RuleTable
					rules={profile.rules}
					onUpdateRule={onUpdateRule}
					onDeleteRule={onDeleteRule}
					onReorderRule={onReorderRule}
				/>
			</section>
		</div>
	);
}
