import { Rule, MatchType, InputType } from "core";

interface RuleTableProps {
	rules: Rule[];
	onUpdateRule: (id: string, field: keyof Rule, value: any) => void;
	onDeleteRule: (id: string) => void;
	onReorderRule: (id: string, direction: "up" | "down") => void;
}

const matchTypes: { value: MatchType; label: string }[] = [
	{ value: "exact", label: "Exact" },
	{ value: "contains", label: "Contains" },
	{ value: "starts_with", label: "Starts with" },
	{ value: "fuzzy", label: "Fuzzy" },
];

const inputTypes: { value: InputType; label: string }[] = [
	{ value: "any", label: "Any" },
	{ value: "text", label: "Text" },
	{ value: "textarea", label: "Textarea" },
	{ value: "select", label: "Select" },
	{ value: "multiselect", label: "Multiselect" },
	{ value: "spinbox", label: "Spinbox" },
	{ value: "number", label: "Number" },
	{ value: "date", label: "Date" },
	{ value: "checkbox", label: "Checkbox" },
	{ value: "radio", label: "Radio" },
	{ value: "email", label: "Email" },
	{ value: "tel", label: "Tel" },
	{ value: "url", label: "URL" },
	{ value: "password", label: "Password" },
	{ value: "range", label: "Range" },
	{ value: "file", label: "File" },
	{ value: "time", label: "Time" },
	{ value: "datetime-local", label: "DateTime Local" },
];

export function RuleTable({ rules, onUpdateRule, onDeleteRule, onReorderRule }: RuleTableProps) {
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
					<th style={{ padding: "10px", width: "100px" }}>Match</th>
					<th style={{ padding: "10px", width: "100px" }}>Input</th>
					<th style={{ padding: "10px" }}>Field Name / Keywords</th>
					<th style={{ padding: "10px" }}>Content to Fill</th>
					<th style={{ padding: "10px", width: "80px" }}>Actions</th>
				</tr>
			</thead>
			<tbody>
				{rules.map((rule, index) => (
					<tr key={rule.id} style={{ borderBottom: "1px solid #eee" }}>
						<td style={{ padding: "10px" }}>
							<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
								<button
									disabled={index === 0}
									onClick={() => onReorderRule(rule.id, "up")}
									style={{ padding: "2px 5px", fontSize: "10px" }}
								>
									▲
								</button>
								<button
									disabled={index === rules.length - 1}
									onClick={() => onReorderRule(rule.id, "down")}
									style={{ padding: "2px 5px", fontSize: "10px" }}
								>
									▼
								</button>
							</div>
						</td>
						<td style={{ padding: "10px" }}>
							<select
								value={rule.matchtype}
								onChange={(e) => onUpdateRule(rule.id, "matchtype", e.target.value)}
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
							<select
								value={rule.inputtype}
								onChange={(e) => onUpdateRule(rule.id, "inputtype", e.target.value)}
								style={{ width: "100%", padding: "5px" }}
							>
								{inputTypes.map((t) => (
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
								value={rule.name}
								onChange={(e) => onUpdateRule(rule.id, "name", e.target.value)}
								style={{ width: "90%", padding: "5px", marginBottom: "5px" }}
							/>
							<input
								type="text"
								placeholder="Keywords (comma separated)"
								value={rule.keywords.join(", ")}
								onChange={(e) =>
									onUpdateRule(
										rule.id,
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
								value={rule.content}
								onChange={(e) => onUpdateRule(rule.id, "content", e.target.value)}
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
								onClick={() => onDeleteRule(rule.id)}
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
