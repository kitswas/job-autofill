export type DomField = {
	id: string | null;
	name: string | null;
	label: string | null;
	ariaLabel: string | null;
	placeholder: string | null;
	automationId: string | null;
	kind: string;
};

export type DomSnapshot = {
	url: string;
	fields: DomField[];
};

export type MatchType = "contains" | "starts_with" | "fuzzy" | "exact";

export const CURRENT_SCHEMA_VERSION = 1;

export type Rule = {
	id: string;
	name: string;
	content: string;
	keywords: string[];
	type: MatchType;
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
};

export type AnalyzeResponse = {
	actions: Action[];
};
