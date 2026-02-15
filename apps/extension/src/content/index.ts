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
			type: (element as HTMLInputElement).type || null,
		});
	});

	return {
		url: window.location.href,
		fields,
	};
}

browser.runtime.onMessage.addListener(async (message, _sender) => {
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

			const payload = action.payload;

			// Handle Checkboxes and Radios
			if (
				target instanceof HTMLInputElement &&
				(target.type === "checkbox" || target.type === "radio")
			) {
				const shouldBeChecked =
					payload.toLowerCase() === "true" ||
					payload.toLowerCase() === "yes" ||
					payload.toLowerCase() === "1";
				if (target.checked !== shouldBeChecked) {
					target.click(); // Using click() is often more reliable for triggering framework events
				}
				continue;
			}

			// Handle Select/Dropdowns
			if (target instanceof HTMLSelectElement) {
				const normalizedPayload = payload.toLowerCase();
				// Try to find matching option by value or text
				const optionToSelect = Array.from(target.options).find(
					(opt) =>
						opt.value.toLowerCase() === normalizedPayload ||
						opt.text.toLowerCase().includes(normalizedPayload),
				);

				if (optionToSelect) {
					target.value = optionToSelect.value;
					target.dispatchEvent(new Event("change", { bubbles: true }));
					target.dispatchEvent(new Event("input", { bubbles: true }));
				}
				continue;
			}

			// Handle Text/TextArea/Date with typing simulation
			target.focus();
			// "Wake up" the component with mouse events
			target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
			target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
			target.dispatchEvent(new MouseEvent("click", { bubbles: true }));

			// Warm-up delay: give the component time to initialize its internal state
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Use the prototype's value setter to bypass React/Vue's internal trackers if they exist
			const nativeValueSetter = Object.getOwnPropertyDescriptor(
				target instanceof HTMLTextAreaElement
					? HTMLTextAreaElement.prototype
					: HTMLInputElement.prototype,
				"value",
			)?.set;

			if (nativeValueSetter) {
				nativeValueSetter.call(target, "");
			} else {
				target.value = "";
			}
			target.dispatchEvent(new Event("input", { bubbles: true }));

			// Typing simulation for more reliability
			const isDatePart =
				target.id.includes("dateSectionMonth") || target.id.includes("dateSectionYear");
			const textToType = isDatePart ? payload.replace(/\D/g, "") : payload;

			for (const char of textToType) {
				const keyCode = char.charCodeAt(0);
				const opts = {
					bubbles: true,
					key: char,
					code: isFinite(Number(char)) ? `Digit${char}` : `Key${char.toUpperCase()}`,
					which: keyCode,
					keyCode: keyCode,
				};

				target.dispatchEvent(new KeyboardEvent("keydown", opts));

				if (nativeValueSetter) {
					const currentValue = target.value;
					nativeValueSetter.call(target, currentValue + char);
				} else {
					target.value += char;
				}

				target.dispatchEvent(new Event("input", { bubbles: true }));
				target.dispatchEvent(new KeyboardEvent("keyup", opts));

				// Small delay to allow framework/component state to catch up
				await new Promise((resolve) => setTimeout(resolve, 10));
			}

			target.dispatchEvent(new Event("change", { bubbles: true }));
			target.dispatchEvent(new Event("blur", { bubbles: true }));
			target.blur();
		}
		return Promise.resolve({ success: true });
	}
});
