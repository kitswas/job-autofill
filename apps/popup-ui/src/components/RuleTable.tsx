import { Rule, MatchType, InputType } from "core";

interface RuleTableProps {
	rules: Rule[];
	onUpdateRule: (id: string, field: keyof Rule, value: any) => void;
	onDeleteRule: (id: string) => void;
	onReorderRule: (id: string, direction: "up" | "down") => void;
}

const matchTypes: { value: MatchType; label: string }[] = [
	{ value: "fuzzy", label: "Fuzzy" },
	{ value: "exact", label: "Exact" },
	{ value: "contains", label: "Contains" },
	{ value: "starts_with", label: "Starts with" },
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
		<table style={{ width: "100%" }}>
			<thead>
				<tr>
					<th style={{ width: "80px" }}>Order</th>
					<th style={{ width: "120px" }}>Match</th>
					<th style={{ width: "150px" }}>Input</th>
					<th>Field Name / Keywords</th>
					<th>Content to Fill</th>
					<th style={{ width: "80px" }}>Actions</th>
				</tr>
			</thead>
			<tbody>
				{rules.map((rule, index) => (
					<tr key={rule.id}>
						<td>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.25rem",
									padding: "0.25rem",
								}}
							>
								<button
									disabled={index === 0}
									type="button"
									onClick={() => onReorderRule(rule.id, "up")}
									data-variant="secondary"
									className="small"
									title="Move Up"
								>
									▲
								</button>
								<button
									disabled={index === rules.length - 1}
									type="button"
									onClick={() => onReorderRule(rule.id, "down")}
									data-variant="secondary"
									className="small"
									title="Move Down"
								>
									▼
								</button>
							</div>
						</td>
						<td>
							<div data-field>
								<select
									aria-label="Match Type"
									value={rule.matchtype}
									onChange={(e) =>
										onUpdateRule(rule.id, "matchtype", e.target.value)
									}
								>
									{matchTypes.map((t) => (
										<option key={t.value} value={t.value}>
											{t.label}
										</option>
									))}
								</select>
							</div>
						</td>
						<td>
							<div data-field>
								<select
									aria-label="Input Type"
									value={rule.inputtype}
									onChange={(e) =>
										onUpdateRule(rule.id, "inputtype", e.target.value)
									}
								>
									{inputTypes.map((t) => (
										<option key={t.value} value={t.value}>
											{t.label}
										</option>
									))}
								</select>
							</div>
						</td>
						<td>
							<label data-field>
								<input
									type="text"
									placeholder="Field Name"
									value={rule.name}
									onChange={(e) => onUpdateRule(rule.id, "name", e.target.value)}
									style={{ marginBottom: "0.5rem" }}
								/>
							</label>
							<label data-field>
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
								/>
							</label>
						</td>
						<td>
							<label data-field>
								<textarea
									value={rule.content}
									onChange={(e) =>
										onUpdateRule(rule.id, "content", e.target.value)
									}
									placeholder="Content to Fill"
									style={{
										minHeight: "80px",
										resize: "vertical",
									}}
								/>
							</label>
						</td>
						<td>
							<button
								type="button"
								onClick={() => onDeleteRule(rule.id)}
								data-variant="danger"
								className="small"
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
