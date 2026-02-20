import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");
const extensionDir = path.resolve(__dirname, "..");
const distDir = path.join(extensionDir, "dist");
const distChromiumDir = path.join(extensionDir, "dist-chromium");

console.log("--- Packaging Extension for Release ---");

// 1. Rebuild extension (prod mode)
console.log("Building extension (production)...");
execSync("node build.js", { cwd: extensionDir, stdio: "inherit" });

// 2. Prepare Chromium build
console.log("Creating Chromium-specific build...");
if (fs.existsSync(distChromiumDir)) {
	fs.rmSync(distChromiumDir, { recursive: true });
}
fs.mkdirSync(distChromiumDir, { recursive: true });

// Copy dist to dist-chromium
try {
	if (fs.cpSync) {
		fs.cpSync(distDir, distChromiumDir, { recursive: true });
	} else {
		// Fallback
		if (process.platform === "win32") {
			execSync(`xcopy "${distDir}" "${distChromiumDir}" /E /I /Y`);
		} else {
			execSync(`cp -r ${distDir}/* ${distChromiumDir}/`);
		}
	}
} catch (e) {
	console.warn("Error during copy, trying alternative...");
	if (process.platform === "win32") {
		execSync(`xcopy "${distDir}" "${distChromiumDir}" /E /I /Y`);
	} else {
		execSync(`cp -r ${distDir}/* ${distChromiumDir}/`);
	}
}

// 3. Update Chromium manifest to use service_worker
const chromeManifestPath = path.join(distChromiumDir, "manifest.json");
const manifest = JSON.parse(readFileSync(chromeManifestPath, "utf8"));

if (manifest.background && manifest.background.scripts) {
	manifest.background.service_worker = manifest.background.scripts[0];
	delete manifest.background.scripts;
}

// MV3 Chrome requires explicit actions for some things, but this is a simple port
writeFileSync(chromeManifestPath, JSON.stringify(manifest, null, 2));
console.log("Chromium manifest updated at:", chromeManifestPath);

console.log("--- Package Complete ---");
