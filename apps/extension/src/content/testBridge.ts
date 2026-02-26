import browser from "webextension-polyfill";

export function setupContentTestBridge() {
	window.addEventListener("message", (event) => {
		if (event.source !== window || !event.data) return;

		const type = event.data.type;
		if (type === "PLAYWRIGHT_TRIGGER_AUTOFILL") {
			console.log(
				"[Job Autofill][content] Test trigger received. Forwarding to background...",
			);
			browser.runtime
				.sendMessage({ type: "TEST_TRIGGER_AUTOFILL", profile: event.data.profile })
				.catch((err) => console.error("[Job Autofill][content] Bridge error:", err));
		} else if (type === "PLAYWRIGHT_TRIGGER_CREATE_PROFILE") {
			console.log(
				"[Job Autofill][content] Create-profile trigger received. Forwarding to background...",
			);
			browser.runtime
				.sendMessage({ type: "TEST_TRIGGER_CREATE_PROFILE" })
				.catch((err) => console.error("[Job Autofill][content] Bridge error:", err));
		} else if (type === "PLAYWRIGHT_REQUEST_PROFILES") {
			// Page requests the current profiles from the background for testing
			browser.runtime
				.sendMessage({ type: "TEST_GET_PROFILES" })
				.then((result) => {
					window.postMessage({ type: "PLAYWRIGHT_RESPONSE_PROFILES", data: result }, "*");
				})
				.catch((err) => console.error("[Job Autofill][content] Bridge error:", err));
		}
	});
}

export default setupContentTestBridge;
