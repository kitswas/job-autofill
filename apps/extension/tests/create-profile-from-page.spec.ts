import { test, expect } from "./fixtures";
import type { Profile } from "core";

test.describe("Create Profile From Page", () => {
	test.beforeEach(async ({ browserName }) => {
		if (browserName === "webkit") test.skip();
	});

	test("creates a profile from the page and is visible in stored profiles", async ({ page }) => {
		await page.goto("http://localhost:5173/test-page.html");

		// helper inside page to request profiles via content/background bridge
		const requestProfiles = async () => {
			return await page.evaluate(
				() =>
					new Promise<Record<string, any>>((resolve) => {
						function onMsg(e: MessageEvent) {
							if (
								e.source === window &&
								e.data?.type === "PLAYWRIGHT_RESPONSE_PROFILES"
							) {
								window.removeEventListener("message", onMsg);
								resolve(e.data.data.profiles || {});
							}
						}
						window.addEventListener("message", onMsg);
						window.postMessage({ type: "PLAYWRIGHT_REQUEST_PROFILES" }, "*");
					}),
			);
		};

		const before = await requestProfiles();

		// Trigger create-profile on the page via the bridge
		await page.evaluate(() =>
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_CREATE_PROFILE" }, "*"),
		);

		// Wait briefly for background to persist
		await page.waitForTimeout(600);

		const after = await requestProfiles();

		const beforeKeys = Object.keys(before);
		const afterKeys = Object.keys(after);

		const newKey = afterKeys.find((k) => k.startsWith("profile_") && !beforeKeys.includes(k));
		expect(newKey).toBeDefined();

		const created = after[newKey!] as Profile;
		expect(created).toBeDefined();
		expect(created.name.toLowerCase()).toContain("localhost");
		expect(created.enabledDomains.length).toBeGreaterThan(0);
		expect(created.rules.length).toBeGreaterThan(0);
	});
});
