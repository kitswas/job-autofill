import { Action } from "core";
import { getActiveAdapter } from "./registry";

export async function applyActions(actions: Action[]): Promise<{ success: boolean }> {
	const adapter = getActiveAdapter();

	for (const action of actions) {
		const target = document.querySelector(action.selector) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| HTMLSelectElement
			| null;

		if (!target) continue;

		// Check if the adapter wants to handle this action
		if (adapter?.applyAction) {
			const handled = await adapter.applyAction(action, target);
			if (handled) continue;
		}

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
