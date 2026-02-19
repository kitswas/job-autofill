import { Profile } from "core";

interface SidebarProps {
	profiles: Record<string, Profile>;
	editingProfileId?: string;
	onSelectProfile: (profile: Profile) => void;
	onCreateProfile: () => void;
	storageUsage: { used: number; total: number; maxPerItem: number; largestItemSize: number };
}

export function Sidebar({
	profiles,
	editingProfileId,
	onSelectProfile,
	onCreateProfile,
	storageUsage,
}: SidebarProps) {
	const itemLimitProgress = (storageUsage.largestItemSize / storageUsage.maxPerItem) * 100;

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
						marginTop: "auto",
						padding: "1rem",
						borderTop: "1px solid rgba(128, 128, 128, 0.2)",
						fontSize: "0.8rem",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: "0.25rem",
						}}
					>
						<span>Total Usage</span>
						<span>{Math.round((storageUsage.used / storageUsage.total) * 100)}%</span>
					</div>
					<meter
						value={storageUsage.used}
						optimum={0.2 * storageUsage.total}
						low={0.5 * storageUsage.total}
						high={0.8 * storageUsage.total}
						max={storageUsage.total}
						style={{ width: "100%", height: "0.5rem" }}
					/>
					<div style={{ textAlign: "right", opacity: 0.6, fontSize: "0.7rem" }}>
						{(storageUsage.used / 1024).toFixed(1)} KB /{" "}
						{(storageUsage.total / 1024).toFixed(0)} KB
					</div>

					<div style={{ marginTop: "1rem" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "0.25rem",
							}}
						>
							<span>Largest Profile Size</span>
							<span>{Math.round(itemLimitProgress)}%</span>
						</div>
						<meter
							value={storageUsage.largestItemSize}
							optimum={0.2 * storageUsage.maxPerItem}
							low={0.5 * storageUsage.maxPerItem}
							high={0.8 * storageUsage.maxPerItem}
							max={storageUsage.maxPerItem}
							style={{ width: "100%", height: "0.5rem" }}
						/>
						<div style={{ textAlign: "right", opacity: 0.6, fontSize: "0.7rem" }}>
							{(storageUsage.largestItemSize / 1024).toFixed(1)} KB /{" "}
							{(storageUsage.maxPerItem / 1024).toFixed(1)} KB
						</div>
					</div>
				</footer>
			</aside>
		</>
	);
}
