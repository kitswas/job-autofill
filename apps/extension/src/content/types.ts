import { Action, DomField } from "core";

export interface SiteAdapter {
	name: string;
	/**
	 * Returns true if this adapter should be active for the given URL.
	 */
	matches: (url: URL) => boolean;

	/**
	 * Optional hook to provide custom field extraction logic or augment the default one.
	 */
	onExtractField?: (element: HTMLElement, field: DomField) => DomField | null;

	/**
	 * Optional hook to handle action application for custom components.
	 * Returns true if the action was handled by the adapter.
	 */
	applyAction?: (action: Action, target: HTMLElement) => Promise<boolean>;
}
