import init, { analyze_form } from "core-wasm";
import wasmUrl from "core-wasm/core_wasm_bg.wasm";

console.log('[Job Autofill][background] script loaded (ESM)');

let wasmReady = false;
let initializing: Promise<void> | null = null;

async function initWasm() {
	if (wasmReady) return;
	if (initializing) return initializing;

	initializing = (async () => {
		try {
			const url = chrome.runtime.getURL(wasmUrl);
			console.debug('[Job Autofill][background] Initializing WASM from:', url);
			await init(url);
			wasmReady = true;
			console.debug('[Job Autofill][background] WASM initialized');
		} catch (err) {
			console.error('[Job Autofill][background] WASM initialization failed:', err);
			initializing = null;
			throw err;
		}
	})();

	return initializing;
}

// Start initialization immediately
initWasm().catch(() => {});

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
			await initWasm();
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
