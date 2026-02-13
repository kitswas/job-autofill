import { build } from "esbuild";
import { mkdir, copyFile, readdir, cp } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

await mkdir(distDir, { recursive: true });

await build({
	entryPoints: {
		background: path.join(__dirname, "src/background/index.ts"),
		content: path.join(__dirname, "src/content/index.ts")
	},
	outdir: distDir,
	bundle: true,
	format: "esm",
	target: "es2022",
	sourcemap: true,
	loader: {
		'.wasm': 'file'
	}
});

await copyFile(
	path.join(__dirname, "manifest.json"),
	path.join(distDir, "manifest.json")
);

// Copy popup files
const popupDist = path.join(__dirname, "../popup-ui/dist");
try {
	await cp(popupDist, distDir, { recursive: true });
} catch (error) {
	console.warn("Popup dist not found, skipping popup copy", error);
}
