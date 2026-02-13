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
		try {
			console.debug('[Job Autofill][background] ANALYZE_FORM input:', message.domPayload, message.profilePayload);
			const result = analyze_form(message.domPayload, message.profilePayload);
			console.debug('[Job Autofill][background] analyze_form raw result:', result);
			const parsed: AnalyzeResponse = JSON.parse(result);
			console.debug('[Job Autofill][background] parsed response:', parsed);
			sendResponse(parsed);
		} catch (error) {
			console.error('[Job Autofill][background] analyze_form failed:', error);
			sendResponse({ actions: [] });
		}
	})().catch((error) => {
		console.error('[Job Autofill][background] unexpected error:', error);
		sendResponse({ actions: [] });
	});

	return true;
});
