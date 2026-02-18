import { Action } from "core";

export async function applyActions(actions: Action[]): Promise<{ success: boolean }> {
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
	return { success: true };
}
