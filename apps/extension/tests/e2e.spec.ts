import { test, expect } from "./fixtures";
import path from "path";
import { fileURLToPath } from "url";
import type { Page, Worker } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Job Autofill E2E", () => {
	test("should verify field visibility on test page", async ({ page }) => {
		const testPagePath = "file://" + path.resolve(__dirname, "pages/test-page.html");
		await page.goto(testPagePath);

		const fields = ["#firstName", "#lastName", "#email", "#phone", "#title"];
		for (const selector of fields) {
			await expect(page.locator(selector)).toBeVisible();
		}
	});

	test("should autofill form using sendAutofillCommand", async ({
		page,
		extensionId,
		browserName,
		context,
	}) => {
		// Currently only supported in Chromium due to extension loading complexity in Playwright
		if (browserName !== "chromium") {
			test.skip();
			return;
		}

		const testPagePath = "file://" + path.resolve(__dirname, "pages/test-page.html");
		await page.goto(testPagePath);

		// Trigger autofill via background script
		if (extensionId === "not-found") {
			throw new Error("Extension not found in Chromium");
		}

		// Wake up the service worker by opening an extension page
		// This is necessary because MV3 service workers can go dormant
		const extensionPage = await context.newPage();
		await extensionPage.goto(`chrome-extension://${extensionId}/index.html`);
		await extensionPage.close();

		// Wait for worker to be available
		let sw = context.serviceWorkers()[0];
		if (!sw) {
			sw = await context.waitForEvent("serviceworker");
		}
		expect(sw).toBeDefined();

		// Execute autofill command in the background script
		await sw.evaluate(async () => {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (tab?.id) {
				// sendAutofillCommand is exposed in test build
				await (self as any).sendAutofillCommand(tab.id, (self as any).mockProfile);
			} else {
				throw new Error("No active tab found");
			}
		});

		// Verify fields filled
		await expect(page.locator("#firstName")).toHaveValue("John");
		await expect(page.locator("#lastName")).toHaveValue("Doe");
		await expect(page.locator("#email")).toHaveValue("john.doe@example.com");
		// Phone might need formatting check or exact match depending on input behavior
		await expect(page.locator("#phone")).toHaveValue("+15551234567");
		await expect(page.locator("#title")).toHaveValue("Senior Software Engineer");
	});
});
