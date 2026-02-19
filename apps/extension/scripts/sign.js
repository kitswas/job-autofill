import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionDir = path.resolve(__dirname, "..");
const distDir = path.join(extensionDir, "dist");
const amoMetadataPath = path.join(extensionDir, "amo-metadata.json");

const issuer = process.env.AMO_JWT_ISSUER;
const secret = process.env.AMO_JWT_SECRET;
if (!issuer || !secret) {
	console.error("Missing environment variables: AMO_JWT_ISSUER and/or AMO_JWT_SECRET");
	console.error("Set them in your shell or use setx / $env:... for persistent values.");
	process.exit(1);
}
const baseArgs = [
	"sign",
	"--source-dir",
	distDir,
	"--api-key",
	issuer,
	"--api-secret",
	secret,
	"--amo-metadata",
	amoMetadataPath,
	"--channel",
	"listed",
];

const candidates = [
	{ cmd: "pnpm", args: ["exec", "--", "web-ext", ...baseArgs], opts: { stdio: "inherit" } },
	{ cmd: "npx", args: ["web-ext", ...baseArgs], opts: { stdio: "inherit" } },
	{ cmd: "web-ext", args: baseArgs, opts: { stdio: "inherit", shell: true } },
];

for (const c of candidates) {
	try {
		const res = spawnSync(c.cmd, c.args, c.opts);
		if (res.error) {
			if (res.error.code === "ENOENT") {
				// command not found, try next candidate
				continue;
			}
			console.error(res.error);
			process.exit(1);
		}
		// If child ran, return its exit status (0 on success)
		process.exit(res.status ?? 0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

console.error(
	"Failed to run `web-ext`. Install it or ensure `pnpm`, `npx` or `web-ext` are available in PATH.",
);
process.exit(1);
