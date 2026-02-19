import { Profile } from "core";
import { StorageMeter } from "./StorageMeter";

interface SidebarProps {
	profiles: Record<string, Profile>;
	editingProfileId?: string;
	onSelectProfile: (profile: Profile) => void;
	onCreateProfile: () => void;
	storageUsage: { used: number; total: number; maxPerItem: number };
}

export function Sidebar({
	profiles,
	editingProfileId,
	onSelectProfile,
	onCreateProfile,
	storageUsage,
}: SidebarProps) {
	return (
		<>
			<nav data-topnav>
				<button data-sidebar-toggle aria-label="Toggle menu" className="outline sm">
					☰
				</button>
				<span style={{ marginLeft: "1rem", fontWeight: "bold" }}>Job Autofill</span>
			</nav>
			<aside data-sidebar style={{ display: "flex", flexDirection: "column" }}>
				<header>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "1rem",
						}}
					>
						<h3>Profiles</h3>
						<button
							data-sidebar-toggle
							aria-label="Close menu"
							className="outline sm"
							style={{ padding: "0 0.5rem" }}
						>
							✕
						</button>
					</div>
					<button
						onClick={onCreateProfile}
						style={{ width: "100%", marginBottom: "1rem" }}
					>
						+ Create Profile
					</button>
				</header>

				<nav style={{ flex: 1, overflowY: "auto" }}>
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
										{Array.isArray(p.rules) ? p.rules.length : 0} rules
									</div>
								</a>
							</li>
						))}
					</ul>
				</nav>

				<footer
					style={{
						gap: "1rem",
						display: "flex",
						flexDirection: "column",
						padding: "1rem",
						borderTop: "1px solid rgba(128, 128, 128, 0.2)",
						fontSize: "0.8rem",
					}}
				>
					<StorageMeter
						label="Total Usage"
						value={storageUsage.used}
						max={storageUsage.total}
						subText={`${(storageUsage.used / 1024).toFixed(1)} KB / ${(storageUsage.total / 1024).toFixed(0)} KB`}
					/>
				</footer>
			</aside>
		</>
	);
}
