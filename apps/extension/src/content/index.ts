import browser from "webextension-polyfill";
import { DomSnapshot, DomField } from "core";

console.log("[Job Autofill][content] script loaded");

function extractFields(): DomSnapshot {
	const fields: DomField[] = [];
	const elements = document.querySelectorAll("input, select, textarea");

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

		fields.push({
			id: element.id || null,
			name: element.getAttribute("name"),
			label: label || null,
			ariaLabel: element.getAttribute("aria-label"),
			placeholder: element.getAttribute("placeholder"),
			automationId: element.getAttribute("data-automation-id"),
			kind: element.tagName.toLowerCase(),
		});
	});

	return {
		url: window.location.href,
		fields,
	};
}

browser.runtime.onMessage.addListener((message, _sender) => {
	if (message.type === "GET_DOM_SNAPSHOT") {
		return Promise.resolve(extractFields());
	} else if (message.type === "APPLY_ACTIONS") {
		const actions = message.actions;
		for (const action of actions) {
			const target = document.querySelector(action.selector) as
				| HTMLInputElement
				| HTMLTextAreaElement
				| HTMLSelectElement
				| null;

			if (!target) continue;

			target.focus();
			target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
			target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
			target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
			target.value = action.payload;
			target.dispatchEvent(new Event("input", { bubbles: true }));
			target.dispatchEvent(new Event("change", { bubbles: true }));
			target.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
			target.blur();
		}
		return Promise.resolve({ success: true });
	}
});
