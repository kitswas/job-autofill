import { build } from "esbuild";
import { mkdir, copyFile, cp, rm } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

await mkdir(distDir, { recursive: true });

// Clean up any old wasm files
try {
	const files = await readdir(distDir);
	for (const file of files) {
		if (file.endsWith(".wasm")) {
			await rm(path.join(distDir, file));
		}
	}
} catch (e) {
	// ignore
}

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
});

await copyFile(path.join(__dirname, "manifest.json"), path.join(distDir, "manifest.json"));

// Copy popup files (now dashboard)
const popupDist = path.join(__dirname, "../popup-ui/dist");
try {
	await cp(popupDist, distDir, { recursive: true });
} catch (error) {
	console.warn("Popup dist not found, skipping popup copy");
}
