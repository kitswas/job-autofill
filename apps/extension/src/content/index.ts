type DomField = {
	id: string | null;
	name: string | null;
	label: string | null;
	placeholder: string | null;
	kind: string;
};

type DomSnapshot = {
	url: string;
	fields: DomField[];
};

function extractFields(): DomSnapshot {
	const fields: DomField[] = [];
	const elements = document.querySelectorAll("input, select, textarea");

	elements.forEach((el) => {
		const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
		const label = element.getAttribute("aria-label");

		fields.push({
			id: element.id || null,
			name: element.getAttribute("name"),
			label,
			placeholder: element.getAttribute("placeholder"),
			kind: element.tagName.toLowerCase()
		});
	});

	return {
		url: window.location.href,
		fields
	};
}

async function requestActions() {
	const domPayload = JSON.stringify(extractFields());

	// Get selected profile
	const { profiles, selectedProfileId } = await chrome.storage.sync.get(['profiles', 'selectedProfileId']);
	let profilePayload = JSON.stringify({});
	if (profiles && selectedProfileId && profiles[selectedProfileId]) {
		const profile = profiles[selectedProfileId];
		profilePayload = JSON.stringify({
			full_name: profile.full_name || null,
			email: profile.email || null,
			phone: profile.phone || null,
		});
	}

	console.debug('[Job Autofill][content] domPayload:', domPayload);
	console.debug('[Job Autofill][content] profilePayload:', profilePayload);

	let response: any = null;
	try {
		response = await chrome.runtime.sendMessage({
			type: "ANALYZE_FORM",
			domPayload,
			profilePayload
		});
		console.debug('[Job Autofill][content] analyze response:', response);
	} catch (err) {
		console.error('[Job Autofill][content] sendMessage error:', err);
		return;
	}

	if (!response?.actions) {
		console.debug('[Job Autofill][content] no actions returned');
		return;
	}

	for (const action of response.actions as Array<{
		selector: string;
		action: string;
		payload: string;
	}>) {
		if (action.action !== "set_value") {
			console.debug('[Job Autofill][content] skipped action (not set_value):', action);
			continue;
		}

		const target = document.querySelector(action.selector) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| HTMLSelectElement
			| null;

		if (!target) {
			console.debug('[Job Autofill][content] selector not found:', action.selector);
			continue;
		}

		console.debug('[Job Autofill][content] set', action.selector, '=>', action.payload);
		target.focus();
		target.value = action.payload;
		target.dispatchEvent(new Event("input", { bubbles: true }));
		target.dispatchEvent(new Event("change", { bubbles: true }));
	}
}

void requestActions();
