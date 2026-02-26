import { DomSnapshot, DomField } from "core";
import { getActiveAdapter } from "./registry";
import { deepQueryFormElements } from "./domWalker";

/**
 * Attempts to find a label for a form element by looking at its
 * shadow host's context in the light DOM.
 */
function resolveLabelFromHost(host: Element): string | null {
	const ariaLabel = host.getAttribute("aria-label");
	if (ariaLabel?.trim()) return ariaLabel.trim();

	if (host.id) {
		const root = host.getRootNode();
		const scope = root instanceof Document ? root : document;
		const label = scope.querySelector(`label[for="${CSS.escape(host.id)}"]`);
		if (label?.textContent?.trim()) return label.textContent.trim();
	}

	const container =
		host.closest(".form-group, fieldset, .field, .form-field, .control-group") ||
		host.parentElement;
	if (container) {
		const label = container.querySelector("label");
		if (label?.textContent?.trim()) return label.textContent.trim();
	}

	return null;
}

export function extractFields(): DomSnapshot {
	const fields: DomField[] = [];
	const entries = deepQueryFormElements(document);
	const adapter = getActiveAdapter();

	entries.forEach(({ element, shadowHost }) => {
		// Ignore hidden fields
		if (
			element.type === "hidden" ||
			element.style.display === "none" ||
			element.style.visibility === "hidden" ||
			element.offsetParent === null
		) {
			return;
		}

		let label = element.getAttribute("aria-label");

		// Try aria-labelledby
		if (!label) {
			const labelledBy = element.getAttribute("aria-labelledby");
			if (labelledBy) {
				label = labelledBy
					.split(/\s+/)
					.map((id) => document.getElementById(id)?.textContent)
					.filter(Boolean)
					.join(" ")
					.trim();
			}
		}

		// Try aria-describedby
		if (!label) {
			const describedBy = element.getAttribute("aria-describedby");
			if (describedBy) {
				label = describedBy
					.split(/\s+/)
					.map((id) => document.getElementById(id)?.textContent)
					.filter(Boolean)
					.join(" ")
					.trim();
			}
		}

		// Try standard <label>
		if (!label && element.labels && element.labels.length > 0) {
			label = Array.from(element.labels)
				.map((l) => l.textContent)
				.filter(Boolean)
				.join(" ")
				.trim();
		}

		// Try to find a legend if in a fieldset
		if (!label) {
			const fieldset = element.closest("fieldset");
			if (fieldset) {
				const legend = fieldset.querySelector("legend");
				if (legend) {
					label = legend.textContent?.trim() || null;
				}
			}
		}

		// Try to find text in parent if it's a small container
		if (!label) {
			const parent = element.parentElement;
			if (parent && parent.textContent && parent.textContent.length < 100) {
				// Get text but exclude the element's own value/text if any
				label = parent.textContent.trim();
			}
		}

		// For elements inside Shadow DOM, resolve label from the host's context
		if (!label && shadowHost) {
			label = resolveLabelFromHost(shadowHost);
		}

		let field: DomField = {
			id: element.id || shadowHost?.id || null,
			name: element.getAttribute("name") || shadowHost?.getAttribute("name") || null,
			label: label || null,
			ariaLabel:
				element.getAttribute("aria-label") ||
				shadowHost?.getAttribute("aria-label") ||
				null,
			placeholder: element.getAttribute("placeholder"),
			automationId:
				element.getAttribute("data-automation-id") ||
				shadowHost?.getAttribute("data-automation-id") ||
				null,
			kind: element.tagName.toLowerCase(),
			type: (element as HTMLInputElement).type || null,
		};

		// Run through adapter hook if active
		if (adapter?.onExtractField) {
			const result = adapter.onExtractField(element, field);
			if (result === null) return;
			field = result;
		}

		fields.push(field);
	});

	return {
		url: window.location.href,
		fields,
	};
}
