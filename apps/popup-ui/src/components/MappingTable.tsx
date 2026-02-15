import { Mapping, MatchType } from "core";

interface MappingTableProps {
	mappings: Mapping[];
	onUpdateMapping: (id: string, field: keyof Mapping, value: any) => void;
	onDeleteMapping: (id: string) => void;
	onReorderMapping: (id: string, direction: "up" | "down") => void;
}

const matchTypes: { value: MatchType; label: string }[] = [
	{ value: "exact", label: "Exact" },
	{ value: "contains", label: "Contains" },
	{ value: "starts_with", label: "Starts with" },
	{ value: "fuzzy", label: "Fuzzy" },
];

export function MappingTable({
	mappings,
	onUpdateMapping,
	onDeleteMapping,
	onReorderMapping,
}: MappingTableProps) {
	return (
		<table style={{ width: "100%", borderCollapse: "collapse" }}>
			<thead>
				<tr
					style={{
						textAlign: "left",
						borderBottom: "2px solid #eee",
					}}
				>
					<th style={{ padding: "10px", width: "50px" }}>Order</th>
					<th style={{ padding: "10px", width: "120px" }}>Type</th>
					<th style={{ padding: "10px" }}>Field Name / Keywords</th>
					<th style={{ padding: "10px" }}>Content to Fill</th>
					<th style={{ padding: "10px", width: "80px" }}>Actions</th>
				</tr>
			</thead>
			<tbody>
				{mappings.map((mapping, index) => (
					<tr key={mapping.id} style={{ borderBottom: "1px solid #eee" }}>
						<td style={{ padding: "10px" }}>
							<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
								<button
									disabled={index === 0}
									onClick={() => onReorderMapping(mapping.id, "up")}
									style={{ padding: "2px 5px", fontSize: "10px" }}
								>
									▲
								</button>
								<button
									disabled={index === mappings.length - 1}
									onClick={() => onReorderMapping(mapping.id, "down")}
									style={{ padding: "2px 5px", fontSize: "10px" }}
								>
									▼
								</button>
							</div>
						</td>
						<td style={{ padding: "10px" }}>
							<select
								value={mapping.type}
								onChange={(e) =>
									onUpdateMapping(mapping.id, "type", e.target.value)
								}
								style={{ width: "100%", padding: "5px" }}
							>
								{matchTypes.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
						</td>
						<td style={{ padding: "10px" }}>
							<input
								type="text"
								placeholder="Field Name"
								value={mapping.name}
								onChange={(e) =>
									onUpdateMapping(mapping.id, "name", e.target.value)
								}
								style={{ width: "90%", padding: "5px", marginBottom: "5px" }}
							/>
							<input
								type="text"
								placeholder="Keywords (comma separated)"
								value={mapping.keywords.join(", ")}
								onChange={(e) =>
									onUpdateMapping(
										mapping.id,
										"keywords",
										e.target.value
											.split(",")
											.map((s) => s.trim())
											.filter(Boolean),
									)
								}
								style={{ width: "90%", padding: "5px" }}
							/>
						</td>
						<td style={{ padding: "10px" }}>
							<textarea
								value={mapping.content}
								onChange={(e) =>
									onUpdateMapping(mapping.id, "content", e.target.value)
								}
								style={{
									width: "90%",
									padding: "5px",
									height: "60px",
									resize: "vertical",
								}}
							/>
						</td>
						<td style={{ padding: "10px" }}>
							<button
								onClick={() => onDeleteMapping(mapping.id)}
								style={{
									backgroundColor: "#ff4444",
									color: "white",
									border: "none",
									padding: "5px 10px",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								Remove
							</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
