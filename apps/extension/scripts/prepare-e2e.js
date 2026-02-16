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
	if (!manifest.host_permissions.includes("file://*")) {
		manifest.host_permissions.push("file://*");
	}

	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log("Manifest updated at:", manifestPath);
} catch (e) {
	console.error("Failed to update manifest.json:", e.message);
	process.exit(1);
}

console.log("--- Prepare Complete ---");
