import { analyze_form } from "core-wasm";

type AnalyzeRequest = {
	type: "ANALYZE_FORM";
	domPayload: string;
	profilePayload: string;
};

type AnalyzeResponse = {
	actions: Array<{ selector: string; action: string; payload: string }>;
};

chrome.runtime.onMessage.addListener((message: AnalyzeRequest, _sender, sendResponse) => {
	if (message?.type !== "ANALYZE_FORM") {
		return;
	}

	(async () => {
		const result = analyze_form(message.domPayload, message.profilePayload);
		const parsed: AnalyzeResponse = JSON.parse(result);
		sendResponse(parsed);
	})().catch((error) => {
		sendResponse({ actions: [] });
		console.error("analyze_form failed", error);
	});

	return true;
});
