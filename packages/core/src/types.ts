export type DomField = {
	id: string | null;
	name: string | null;
	label: string | null;
	placeholder: string | null;
	kind: string;
};

export type DomSnapshot = {
	url: string;
	fields: DomField[];
};

export type MatchType = "contains" | "starts_with" | "fuzzy" | "exact";

export type Mapping = {
	id: string;
	name: string;
	content: string;
	keywords: string[];
	type: MatchType;
};

export type Profile = {
	id: string;
	name: string;
	enabledDomains: string[]; // e.g., ["myworkdayjobs.com", "*"]
	mappings: Mapping[];
};

export type Action = {
	selector: string;
	action: "set_value";
	payload: string;
};

export type AnalyzeResponse = {
	actions: Action[];
};
