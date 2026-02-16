import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
}>({
	context: async ({ browser, browserName }, use) => {
		const pathToExtension =
			browserName === "chromium"
				? path.resolve(__dirname, "../dist-chromium")
				: path.resolve(__dirname, "../dist");

		if (browserName === "chromium") {
			const context = await chromium.launchPersistentContext("", {
				headless: false,
				args: [
					`--disable-extensions-except=${pathToExtension}`,
					`--load-extension=${pathToExtension}`,
				],
			});

			// Wake up the background worker by opening an extension page
			const page = await context.newPage();
			await page.goto("chrome://extensions"); // Triggers extension discovery

			await use(context);
			await context.close();
		} else {
			const context = await browser.newContext();
			await use(context);
			await context.close();
		}
	},
	extensionId: async ({ context, browserName }, use) => {
		if (browserName !== "chromium") {
			await use("not-supported-in-non-chromium");
			return;
		}

		// Attempt to find the worker multiple times
		let background = null;
		for (let i = 0; i < 5; i++) {
			background = context.serviceWorkers()[0];
			if (background) break;
			await new Promise((r) => setTimeout(r, 1000));
		}

		if (!background) {
			background = await context
				.waitForEvent("serviceworker", { timeout: 10000 })
				.catch(() => null);
		}

		const extensionId = background ? background.url().split("/")[2] : "not-found";
		await use(extensionId);
	},
});

export const expect = base.expect;
