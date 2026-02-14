import browser from "webextension-polyfill";
import { DomSnapshot, DomField } from "core";

console.log("[Job Autofill][content] script loaded");

function extractFields(): DomSnapshot {
	const fields: DomField[] = [];
	const elements = document.querySelectorAll("input, select, textarea");

	elements.forEach((el) => {
		const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

		let label = element.getAttribute("aria-label");
		if (!label && element.labels && element.labels.length > 0) {
			label = Array.from(element.labels)
				.map((l) => l.textContent)
				.filter(Boolean)
				.join(" ")
				.trim();
		}

		fields.push({
			id: element.id || null,
			name: element.getAttribute("name"),
			label: label || null,
			placeholder: element.getAttribute("placeholder"),
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
			target.value = action.payload;
			target.dispatchEvent(new Event("input", { bubbles: true }));
			target.dispatchEvent(new Event("change", { bubbles: true }));
		}
		return Promise.resolve({ success: true });
	}
});
