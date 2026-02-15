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

export type InputType = "any" | "text" | "select" | "multiselect" | "spinbox" | "number" | "date";

export const CURRENT_SCHEMA_VERSION = 1;

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
