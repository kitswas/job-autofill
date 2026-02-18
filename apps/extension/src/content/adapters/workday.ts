import { SiteAdapter } from "../types";

export const WorkdayAdapter: SiteAdapter = {
	name: "Workday",

	matches: (url: URL) => url.hostname.includes("myworkdayjobs.com"),

	onExtractField: (element, field) => {
		// Workday often uses data-automation-id for internal fields
		if (!field.automationId) {
			const automationId = element.getAttribute("data-automation-id");
			if (automationId) {
				return { ...field, automationId };
			}
		}
		return field;
	},

	applyAction: async (action, target) => {
		const isCustomSelect =
			action.inputtype === "select" ||
			action.inputtype === "multiselect" ||
			target.getAttribute("data-uxi-widget-type") === "selectinput" ||
			target.getAttribute("role") === "combobox" ||
			target.getAttribute("data-automation-id") === "searchBox" ||
			target.id.includes("degree") ||
			target.id.includes("fieldOfStudy") ||
			target.id.includes("skills");

		if (!isCustomSelect) return false;

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
			(target as HTMLInputElement).value = "";
		}
		target.dispatchEvent(new Event("input", { bubbles: true }));

		for (const char of action.payload) {
			const opts = { bubbles: true, key: char };
			target.dispatchEvent(new KeyboardEvent("keydown", opts));

			if (nativeValueSetter) {
				nativeValueSetter.call(target, (target as HTMLInputElement).value + char);
			} else {
				(target as HTMLInputElement).value += char;
			}

			target.dispatchEvent(new Event("input", { bubbles: true }));
			target.dispatchEvent(new KeyboardEvent("keyup", opts));
			await new Promise((resolve) => setTimeout(resolve, 30));
		}

		// Wait for search results to appear in the virtualized list
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Find the first option in the search results list and click it
		const listContainer = document.querySelector('[data-automation-id="activeListContainer"]');
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
		return true;
	},
};
