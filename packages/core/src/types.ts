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

export type Mapping = {
	content: string;
	keywords: string[];
};

export type Profile = {
	id: string;
	name: string;
	enabledDomains: string[]; // e.g., ["myworkdayjobs.com", "*"]
	mappings: Record<string, Mapping>;
};

export type Action = {
	selector: string;
	action: "set_value";
	payload: string;
};

export type AnalyzeResponse = {
	actions: Action[];
};
