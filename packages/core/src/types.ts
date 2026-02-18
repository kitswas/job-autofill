export type DomField = {
	id: string | null;
	name: string | null;
	label: string | null;
	ariaLabel: string | null;
	placeholder: string | null;
	automationId: string | null;
	kind: string;
	type: string | null;
};

export type DomSnapshot = {
	url: string;
	fields: DomField[];
};

export type MatchType = "contains" | "starts_with" | "fuzzy" | "exact";

export type InputType =
	| "any"
	| "text"
	| "textarea"
	| "select"
	| "multiselect"
	| "spinbox"
	| "number"
	| "date"
	| "checkbox"
	| "radio"
	| "email"
	| "tel"
	| "url"
	| "password"
	| "range"
	| "file"
	| "time"
	| "datetime-local";

export type Rule = {
	id: string;
	name: string;
	content: string;
	keywords: string[];
	matchtype: MatchType;
	inputtype: InputType;
};

export type Profile = {
	version: number;
	id: string;
	name: string;
	enabledDomains: string[]; // e.g., ["myworkdayjobs.com", "*"]
	rules: Rule[];
};

export type Action = {
	selector: string;
	action: "set_value";
	payload: string;
	inputtype: InputType;
};

export type AnalyzeResponse = {
	actions: Action[];
};
