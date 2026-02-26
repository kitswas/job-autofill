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

// --- E2E Test Bridge (dev only) ---
if (typeof __TEST_MODE__ !== "undefined" && __TEST_MODE__) {
	import("./testBridge")
		.then((m) => m.setupContentTestBridge())
		.catch((err) => console.error("[Job Autofill][content] Failed to load test bridge:", err));
}
