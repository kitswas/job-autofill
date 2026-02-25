import { test, expect } from "./fixtures";
import type { Profile } from "core";

test.describe("Create Profile From Page", () => {
	test.beforeEach(async ({ browserName }) => {
		if (browserName === "webkit") test.skip();
	});

	test("should open the dashboard after triggering profile creation (chromium only)", async ({
		context,
		page,
		browserName,
	}) => {
		if (browserName !== "chromium") test.skip();

		await page.goto("http://localhost:5173/test-page.html");

		const newPagePromise = context.waitForEvent("page");

		await page.evaluate(() => {
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_CREATE_PROFILE" }, "*");
		});

		const dashboardPage = await newPagePromise;
		await dashboardPage.waitForLoadState("domcontentloaded");

		expect(dashboardPage.url()).toContain("index.html");
	});

	test("should save the new profile to storage (chromium only)", async ({
		context,
		page,
		browserName,
	}) => {
		if (browserName !== "chromium") test.skip();

		await page.goto("http://localhost:5173/test-page.html");

		// Note the storage keys that exist before we trigger creation
		let workers = context.serviceWorkers();
		const keysBefore: string[] = await workers[0].evaluate(async () => {
			const data = await (globalThis as any).chrome.storage.sync.get(null);
			return Object.keys(data);
		});

		const newPagePromise = context.waitForEvent("page");

		await page.evaluate(() => {
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_CREATE_PROFILE" }, "*");
		});

		await newPagePromise;

		// Give the background script time to write to storage
		await page.waitForTimeout(500);

		workers = context.serviceWorkers();
		const storageAfter: Record<string, unknown> = await workers[0].evaluate(async () => {
			return (globalThis as any).chrome.storage.sync.get(null);
		});

		// Find newly added profile key
		const newKey = Object.keys(storageAfter).find(
			(k) => k.startsWith("profile_") && !keysBefore.includes(k),
		);
		expect(newKey).toBeDefined();

		const created = storageAfter[newKey!] as Profile;
		expect(created).toBeDefined();
		expect(created.name).toContain("localhost");
		expect(created.enabledDomains).toContain("localhost");
		expect(created.rules.length).toBeGreaterThan(0);
	});

	test("should derive field types correctly from the test page (chromium only)", async ({
		context,
		page,
		browserName,
	}) => {
		if (browserName !== "chromium") test.skip();

		await page.goto("http://localhost:5173/test-page.html");

		let workers = context.serviceWorkers();
		const keysBefore: string[] = await workers[0].evaluate(async () => {
			return Object.keys(await (globalThis as any).chrome.storage.sync.get(null));
		});

		const newPagePromise = context.waitForEvent("page");

		await page.evaluate(() => {
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_CREATE_PROFILE" }, "*");
		});

		await newPagePromise;
		await page.waitForTimeout(500);

		workers = context.serviceWorkers();
		const storageAfter: Record<string, unknown> = await workers[0].evaluate(async () => {
			return (globalThis as any).chrome.storage.sync.get(null);
		});

		const newKey = Object.keys(storageAfter).find(
			(k) => k.startsWith("profile_") && !keysBefore.includes(k),
		);
		const created = storageAfter[newKey!] as Profile;

		// test-page.html has: type="email" for #email, type="tel" for #phone
		const emailRule = created.rules.find((r) => r.inputtype === "email");
		expect(emailRule).toBeDefined();

		const telRule = created.rules.find((r) => r.inputtype === "tel");
		expect(telRule).toBeDefined();

		// Verify rule labels match field ids / names from test-page.html
		const ruleNames = created.rules.map((r) => r.name.toLowerCase());
		expect(ruleNames.some((n) => n.includes("first") || n === "firstname")).toBe(true);
		expect(ruleNames.some((n) => n.includes("last") || n === "lastname")).toBe(true);
		expect(ruleNames.some((n) => n.includes("email"))).toBe(true);
	});

	test("should not create duplicate rules for fields with the same label (chromium only)", async ({
		context,
		page,
		browserName,
	}) => {
		if (browserName !== "chromium") test.skip();

		await page.goto("http://localhost:5173/test-page.html");

		let workers = context.serviceWorkers();
		const keysBefore: string[] = await workers[0].evaluate(async () => {
			return Object.keys(await (globalThis as any).chrome.storage.sync.get(null));
		});

		const newPagePromise = context.waitForEvent("page");

		await page.evaluate(() => {
			window.postMessage({ type: "PLAYWRIGHT_TRIGGER_CREATE_PROFILE" }, "*");
		});

		await newPagePromise;
		await page.waitForTimeout(500);

		workers = context.serviceWorkers();
		const storageAfter: Record<string, unknown> = await workers[0].evaluate(async () => {
			return (globalThis as any).chrome.storage.sync.get(null);
		});

		const newKey = Object.keys(storageAfter).find(
			(k) => k.startsWith("profile_") && !keysBefore.includes(k),
		);
		const created = storageAfter[newKey!] as Profile;

		// Rule names should all be unique (deduplication by label)
		const names = created.rules.map((r) => r.name.toLowerCase());
		const uniqueNames = new Set(names);
		expect(names.length).toBe(uniqueNames.size);
	});
});
