import { build } from "esbuild";
import { mkdir, copyFile, cp, rm, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const isTest = process.argv.includes("--test");

await mkdir(distDir, { recursive: true });

console.log(`Building extension... (Test Mode: ${isTest})`);

await build({
	entryPoints: {
		background: path.join(__dirname, "src/background/index.ts"),
		content: path.join(__dirname, "src/content/index.ts"),
	},
	outdir: distDir,
	bundle: true,
	format: "esm",
	target: "es2022",
	sourcemap: true,
	define: {
		__TEST_MODE__: isTest ? "true" : "false",
	},
});

const manifestSrc = path.join(__dirname, "manifest.json");
const manifestDst = path.join(distDir, "manifest.json");
const manifestRaw = await readFile(manifestSrc, "utf8");
const manifest = JSON.parse(manifestRaw);
if (isTest) {
	manifest.version = "999.999.999";
}
await writeFile(manifestDst, JSON.stringify(manifest, null, 2));
await copyFile(path.join(__dirname, "../../LICENSE"), path.join(distDir, "LICENSE"));
await cp(path.join(__dirname, "icons"), path.join(distDir, "icons"), { recursive: true });

// Copy popup files (now dashboard)
const popupDist = path.join(__dirname, "../popup-ui/dist");
try {
	await cp(popupDist, distDir, { recursive: true });
} catch (error) {
	console.warn("Popup dist not found, skipping popup copy");
}
