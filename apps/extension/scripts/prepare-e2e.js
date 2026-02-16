import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");
const extensionDir = path.resolve(__dirname, "..");
const distDir = path.join(extensionDir, "dist");

console.log("--- Preparing Extension for E2E Testing ---");

// 1. Build dependencies and extension
console.log("Building monorepo...");
execSync("pnpm build", { cwd: rootDir, stdio: "inherit" });

console.log("Rebuilding extension in TEST mode...");
execSync("node build.js --test", { cwd: extensionDir, stdio: "inherit" });

// 2. Ensure manifest.json in dist has fixed ID for Gecko/Firefox compatibility
const manifestPath = path.join(distDir, "manifest.json");
try {
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

	console.log("Applying test-mode manifest settings...");
	manifest.browser_specific_settings = manifest.browser_specific_settings || {};
	manifest.browser_specific_settings.gecko = manifest.browser_specific_settings.gecko || {};
	manifest.browser_specific_settings.gecko.id = "job-autofill-e2e@kitswas.github.io";

	// Ensure all test URLs are allowed
	manifest.host_permissions = manifest.host_permissions || [];
	if (!manifest.host_permissions.includes("http://localhost:5173/*")) {
		manifest.host_permissions.push("http://localhost:5173/*");
	}

	// Also allow content scripts on localhost:5173
	if (manifest.content_scripts) {
		manifest.content_scripts.forEach((script) => {
			if (!script.matches.includes("http://localhost:5173/*")) {
				script.matches.push("http://localhost:5173/*");
			}
		});
	}

	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log("Manifest updated at:", manifestPath);

	// Create a Chromium-specific build (MV3 service_worker)
	const distChromiumDir = path.join(extensionDir, "dist-chromium");
	// Simple recursive copy
	// Node 16.7+ has cpSync. Checking if available or use shell.
	try {
		const fs = await import("fs");
		if (fs.cpSync) {
			fs.cpSync(distDir, distChromiumDir, { recursive: true });
		} else {
			// Fallback
			execSync(`xcopy "${distDir}" "${distChromiumDir}" /E /I /Y`);
		}
	} catch (e) {
		// Fallback for older node or platform specific
		// Just use cp -r equivalent
		execSync(`xcopy /E /I /Y "${distDir}" "${distChromiumDir}"`); // Windows specific
	}

	// Update Chromium manifest to use service_worker
	const chromeManifestPath = path.join(distChromiumDir, "manifest.json");
	const chromeManifest = JSON.parse(readFileSync(chromeManifestPath, "utf8"));
	if (chromeManifest.background && chromeManifest.background.scripts) {
		chromeManifest.background.service_worker = chromeManifest.background.scripts[0];
		delete chromeManifest.background.scripts;

		// Ensure permissions for localhost:5173 are present (should be inherited from dist but safe to check)
		chromeManifest.host_permissions = chromeManifest.host_permissions || [];
		if (!chromeManifest.host_permissions.includes("http://localhost:5173/*")) {
			chromeManifest.host_permissions.push("http://localhost:5173/*");
		}

		writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2));
		console.log("Created Chromium manifest at:", chromeManifestPath);
	}
} catch (e) {
	console.error("Failed to update manifest.json:", e.message);
	process.exit(1);
}

console.log("--- Prepare Complete ---");
