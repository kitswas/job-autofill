export const CURRENT_SCHEMA_VERSION = 1;

export const MATCH_SCORES = {
	EXACT: 100,
	CONTAINS: 50,
	FUZZY_SUBSTRING: 50,
	STARTS_WITH: 30,
	FUZZY_BASE: 50,
} as const;

export const FUZZY_THRESHOLD = 0.4;

export const REGEX = {
	CAMEL_CASE: /([a-z])([A-Z])/g,
	SPECIAL_CHARS: /[._-]/g,
	PARENTHESES: /[()]/g,
	WHITESPACE: /\s+/g,
	ESCAPE_REGEX: /[.*+?^${}()|[\]\\]/g,
} as const;
