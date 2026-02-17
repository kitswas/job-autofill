import { test as base, chromium, firefox, type BrowserContext } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { type ChildProcess } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
	webExtProcess?: ChildProcess;
}>({
	// No browser should be headless. We need UI interaction
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
		} else if (browserName === "firefox") {
			const tempDir = path.join(
				process.env.TEMP || "/tmp",
				`playwright-firefox-${Math.random().toString(36).substring(7)}`,
			);
			const extensionsDir = path.join(tempDir, "extensions");
			fs.mkdirSync(extensionsDir, { recursive: true });

			// Copy the extension to the extensions directory with its ID as name
			// This is one way Firefox loads extensions in a profile
			// Since it's a directory, we might need to zip it or just use the directory
			// Firefox also accepts directories if they are named correctly
			const extensionDirDest = path.join(extensionsDir, "job-autofill-e2e@kitswas.github.io");

			// Simple copy
			const copyDir = (src, dest) => {
				fs.mkdirSync(dest, { recursive: true });
				for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
					if (entry.isDirectory())
						copyDir(path.join(src, entry.name), path.join(dest, entry.name));
					else fs.copyFileSync(path.join(src, entry.name), path.join(dest, entry.name));
				}
			};
			copyDir(pathToExtension, extensionDirDest);

			const context = await firefox.launchPersistentContext(tempDir, {
				headless: false,
				firefoxUserPrefs: {
					"xpinstall.signatures.required": false,
					"extensions.enabledScopes": 15,
					"extensions.autoDisableScopes": 0,
					"extensions.startupScanScanning": true,
				},
			});

			await use(context);
			await context.close();
			try {
				fs.rmSync(tempDir, { recursive: true, force: true });
			} catch (e) {}
		} else {
			const context = await browser.newContext();
			await use(context);
			await context.close();
		}
	},
	extensionId: async ({ context, browserName }, use) => {
		if (browserName === "chromium") {
			// Attempt to find the worker multiple times
			let background = null;
			for (let i = 0; i < 10; i++) {
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
		} else if (browserName === "firefox") {
			// For Firefox, we use the fixed ID from manifest
			await use("job-autofill-e2e@kitswas.github.io");
		} else {
			await use("not-supported-in-non-chromium");
		}
	},
});

export const expect = base.expect;
