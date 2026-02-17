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
		<aside data-sidebar>
			<header>
				<h3>Profiles</h3>
				<button onClick={onCreateProfile} style={{ width: "100%", marginBottom: "1rem" }}>
					+ Create Profile
				</button>
			</header>

			<nav>
				<ul>
					{Object.values(profiles).map((p) => (
						<li key={p.id}>
							<a
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onSelectProfile(p);
								}}
								aria-current={editingProfileId === p.id ? "page" : undefined}
							>
								<strong>{p.name}</strong>
								<div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
									{Array.isArray(p.rules) ? p.rules.length : 0} fields
								</div>
							</a>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}
