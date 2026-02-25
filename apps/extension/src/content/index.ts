import browser from "webextension-polyfill";
import { extractFields } from "./extractor";
import { applyActions } from "./applier";

console.log("[Job Autofill][content] script loaded");

browser.runtime.onMessage.addListener(
	async (message: any, _sender: browser.Runtime.MessageSender) => {
		if (message.type === "GET_DOM_SNAPSHOT") {
			return Promise.resolve(extractFields());
		} else if (message.type === "APPLY_ACTIONS") {
			return applyActions(message.actions);
		}
	},
);

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
	} else if (
		event.source === window &&
		event.data?.type === "PLAYWRIGHT_TRIGGER_CREATE_PROFILE"
	) {
		console.log(
			"[Job Autofill][content] Create-profile trigger received. Forwarding to background...",
		);
		browser.runtime
			.sendMessage({ type: "TEST_TRIGGER_CREATE_PROFILE" })
			.catch((err) => console.error("[Job Autofill][content] Bridge error:", err));
	}
});
