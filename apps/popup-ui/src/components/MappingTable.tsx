import { Profile, Mapping } from "core";

interface MappingTableProps {
	mappings: Profile["mappings"];
	onUpdateMapping: (key: string, field: keyof Mapping, value: string | string[]) => void;
	onDeleteMapping: (key: string) => void;
}

export function MappingTable({ mappings, onUpdateMapping, onDeleteMapping }: MappingTableProps) {
	return (
		<table style={{ width: "100%", borderCollapse: "collapse" }}>
			<thead>
				<tr
					style={{
						textAlign: "left",
						borderBottom: "2px solid #eee",
					}}
				>
					<th style={{ padding: "10px" }}>Field Identifier / Keywords</th>
					<th style={{ padding: "10px" }}>Content to Fill</th>
					<th style={{ padding: "10px" }}>Actions</th>
				</tr>
			</thead>
			<tbody>
				{Object.entries(mappings).map(([key, mapping]) => (
					<tr key={key} style={{ borderBottom: "1px solid #eee" }}>
						<td style={{ padding: "10px" }}>
							<input
								type="text"
								placeholder="Keywords (comma separated)"
								value={mapping.keywords.join(", ")}
								onChange={(e) =>
									onUpdateMapping(
										key,
										"keywords",
										e.target.value.split(",").map((s) => s.trim()),
									)
								}
								style={{ width: "90%", padding: "5px" }}
							/>
							<div style={{ fontSize: "10px", color: "#888" }}>ID: {key}</div>
						</td>
						<td style={{ padding: "10px" }}>
							<textarea
								value={mapping.content}
								onChange={(e) => onUpdateMapping(key, "content", e.target.value)}
								style={{
									width: "90%",
									padding: "5px",
									height: "40px",
								}}
							/>
						</td>
						<td style={{ padding: "10px" }}>
							<button onClick={() => onDeleteMapping(key)}>Remove</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
