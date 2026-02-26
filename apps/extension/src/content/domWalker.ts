/**
 * Shared Shadow-DOM-aware form element traversal utilities.
 *
 * Used by both the extractor (full-page scan) and the applier
 * (targeted element resolution).
 */

/** Union of the three native form element types. */
export type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const FORM_SELECTOR = "input, select, textarea";

/** Returns true when `el` is a native form element. */
export function isFormElement(el: Element): el is FormElement {
	return (
		el instanceof HTMLInputElement ||
		el instanceof HTMLTextAreaElement ||
		el instanceof HTMLSelectElement
	);
}

/** A form element found during a deep scan, with optional shadow host metadata. */
export type FormElementEntry = {
	/** The actual `<input>`, `<select>`, or `<textarea>`. */
	element: FormElement;
	/**
	 * If the element lives inside a shadow root, this is the shadow host
	 * (e.g. `<dbx-textinput>`). `null` for light-DOM elements.
	 */
	shadowHost: Element | null;
};

/**
 * Recursively collects **all** form elements (`input`, `select`, `textarea`)
 * reachable from `root`, piercing every open Shadow DOM boundary.
 *
 * @param root – start node; typically `document` for a full-page scan.
 */
export function deepQueryFormElements(root: Document | ShadowRoot): FormElementEntry[] {
	const results: FormElementEntry[] = [];
	const shadowHost = root instanceof ShadowRoot ? root.host : null;

	root.querySelectorAll(FORM_SELECTOR).forEach((el) => {
		results.push({ element: el as FormElement, shadowHost });
	});

	root.querySelectorAll("*").forEach((el) => {
		if (el.shadowRoot) {
			results.push(...deepQueryFormElements(el.shadowRoot));
		}
	});

	return results;
}

/**
 * Given any element matched by a CSS selector (which may be a shadow host,
 * a wrapper `<div>`, or the form element itself), drill down and return the
 * first reachable `<input>`, `<select>`, or `<textarea>`.
 *
 * Resolution order:
 *  1. The element itself, if it is already a form element.
 *  2. The first form element inside the element's shadow root.
 *  3. The first form element among the element's light-DOM descendants
 *     (including one level of shadow root on each descendant).
 *
 * @returns The resolved form element, or `null` if none was found.
 */
export function resolveFormElement(root: Element): FormElement | null {
	if (isFormElement(root)) return root;

	// Shadow root of the matched element itself
	if (root.shadowRoot) {
		const inner = root.shadowRoot.querySelector(FORM_SELECTOR);
		if (inner) return inner as FormElement;
	}

	// Light-DOM descendants (one shadow-level deep on each)
	const children = root.querySelectorAll("*");
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (isFormElement(child)) return child;
		if (child.shadowRoot) {
			const inner = child.shadowRoot.querySelector(FORM_SELECTOR);
			if (inner) return inner as FormElement;
		}
	}

	return null;
}
