export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Storage Quotas for browser.storage.sync
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync#storage_quotas_for_sync_data
 */
export const STORAGE_SYNC_QUOTA_BYTES = 102400;
export const STORAGE_SYNC_QUOTA_BYTES_PER_ITEM = 8192;
export const STORAGE_SYNC_MAX_ITEMS = 512;

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
