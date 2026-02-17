import { test, expect } from "./fixtures";

test.describe("Job Autofill E2E", () => {
	test("should verify field visibility on test page", async ({ page }) => {
		await page.goto("http://localhost:5173/test-page.html");

		const fields = ["#firstName", "#lastName", "#email", "#phone", "#title"];
		for (const selector of fields) {
			await expect(page.locator(selector)).toBeVisible();
		}
	});

	test("should autofill form using test bridge", async ({ page, browserName }) => {
		// Skip webkit since the extension doesn't support Safari yet
		if (browserName === "webkit") {
			test.skip();
			return;
		}

		await page.goto("http://localhost:5173/test-page.html");

		// 1. Send a message to the window. The content script catches this
		// and forwards it to the background script to trigger the autofill.
		await page.evaluate(() => {
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_AUTOFILL" }, "*");
		});

		// 2. Wait for the messaging pipeline and the content script's
		// typing simulation delays (setTimeout) to complete.
		await page.waitForTimeout(1500);

		// 3. Verify fields filled (assuming mockProfile uses these values)
		await expect(page.locator("#firstName")).toHaveValue("John");
		await expect(page.locator("#lastName")).toHaveValue("Doe");
		await expect(page.locator("#email")).toHaveValue("john.doe@example.com");
		await expect(page.locator("#phone")).toHaveValue("+15551234567");
		await expect(page.locator("#title")).toHaveValue("Senior Software Engineer");
	});
});
