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

			// Handle Select/Dropdowns (Standard)
			if (target instanceof HTMLSelectElement) {
				target.focus();
				await new Promise((resolve) => setTimeout(resolve, 50));

				const normalizedPayload = payload.toLowerCase();
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

				await new Promise((resolve) => setTimeout(resolve, 50));
				target.blur();
				continue;
			}

			// Handle Workday Custom Selects / Multiselects
			const isCustomSelect =
				action.inputtype === "select" ||
				action.inputtype === "multiselect" ||
				target.getAttribute("data-uxi-widget-type") === "selectinput" ||
				target.getAttribute("role") === "combobox" ||
				target.getAttribute("data-automation-id") === "searchBox" ||
				target.id.includes("degree") ||
				target.id.includes("fieldOfStudy") ||
				target.id.includes("skills");

			if (isCustomSelect) {
				target.focus();
				target.click();
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Clear and Type
				const nativeValueSetter = Object.getOwnPropertyDescriptor(
					HTMLInputElement.prototype,
					"value",
				)?.set;
				if (nativeValueSetter) {
					nativeValueSetter.call(target, "");
				} else {
					target.value = "";
				}
				target.dispatchEvent(new Event("input", { bubbles: true }));

				for (const char of payload) {
					const opts = { bubbles: true, key: char };
					target.dispatchEvent(new KeyboardEvent("keydown", opts));

					if (nativeValueSetter) {
						nativeValueSetter.call(target, target.value + char);
					} else {
						target.value += char;
					}

					target.dispatchEvent(new Event("input", { bubbles: true }));
					target.dispatchEvent(new KeyboardEvent("keyup", opts));
					await new Promise((resolve) => setTimeout(resolve, 30));
				}

				// Wait for search results to appear in the virtualized list
				await new Promise((resolve) => setTimeout(resolve, 800));

				// Find the first option in the search results list and click it
				const listContainer = document.querySelector(
					'[data-automation-id="activeListContainer"]',
				);
				const firstOption = listContainer?.querySelector(
					'[role="option"], [data-automation-id="menuItem"], [data-automation-id="promptLeafNode"]',
				);

				const enterOpts = { bubbles: true, key: "Enter", keyCode: 13, which: 13 };
				if (firstOption) {
					(firstOption as HTMLElement).click();
					await new Promise((resolve) => setTimeout(resolve, 300));
				} else {
					// Fallback to Enter if we can't find the element visually
					target.dispatchEvent(new KeyboardEvent("keydown", enterOpts));
					target.dispatchEvent(new KeyboardEvent("keyup", enterOpts));
					await new Promise((resolve) => setTimeout(resolve, 300));
				}
				target.dispatchEvent(new KeyboardEvent("keydown", enterOpts));
				target.dispatchEvent(new KeyboardEvent("keyup", enterOpts));
				await new Promise((resolve) => setTimeout(resolve, 500));

				target.blur();
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
				action.inputtype === "spinbox" ||
				target.id.includes("dateSectionMonth") ||
				target.id.includes("dateSectionYear");
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

// --- E2E Test Bridge ---
window.addEventListener("message", (event) => {
	if (event.source === window && event.data?.type === "PLAYWRIGHT_TRIGGER_AUTOFILL") {
		console.log("[Job Autofill][content] Test trigger received. Forwarding to background...");
		browser.runtime
			.sendMessage({
				type: "TEST_TRIGGER_AUTOFILL",
				profile: event.data.profile,
			})
			.catch((err) => console.error("[Job Autofill][content] Bridge error:", err));
	}
});
