import { DomSnapshot, DomField } from "core";
import { getActiveAdapter } from "./registry";

export function extractFields(): DomSnapshot {
	const fields: DomField[] = [];
	const elements = document.querySelectorAll("input, select, textarea");
	const adapter = getActiveAdapter();

	elements.forEach((el) => {
		const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

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

		let field: DomField = {
			id: element.id || null,
			name: element.getAttribute("name"),
			label: label || null,
			ariaLabel: element.getAttribute("aria-label"),
			placeholder: element.getAttribute("placeholder"),
			automationId: element.getAttribute("data-automation-id"),
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
