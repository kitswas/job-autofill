# Job Autofill

Monorepo for a Manifest V3 browser extension that autofills job application forms (for example Workday) using a Rust + WebAssembly matching engine.

## Workspace Layout

- `crates/engine`: Rust WebAssembly core (`wasm-bindgen` exports)
- `packages/core-wasm`: Generated wasm-pack output consumed by apps
- `apps/extension`: Manifest V3 extension (background + content scripts)
- `apps/popup-ui`: React popup UI for managing profiles

## Prerequisites

Install the following tools:

- Node.js 20+
- `pnpm` 9+
- Rust toolchain (`rustup`)
- `wasm-pack`

Optional (recommended):

- Chrome or Edge for loading unpacked extension

## Install Dependencies

From repo root:

```bash
pnpm install
```

## Build the Project

From repo root:

```bash
pnpm build:all
```

This builds the WebAssembly package, extension, and popup UI in sequence.

## Build Components Individually

From repo root:

```bash
pnpm wasm:build
pnpm build:extension
pnpm build:popup
```

## Load Extension in Chrome/Edge (Unpacked)

1. Open extensions page (`chrome://extensions` or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select folder: [`apps/extension/dist`](./apps/extension/dist).

## Load Extension in Firefox (Developer Run)

If you want to launch the extension in Firefox for development, `web-ext` provides a convenient runner that installs a temporary add-on and opens a browser instance.

From the built extension directory run:

```bash
cd apps/extension/dist
web-ext run --browser-console --devtools --start-url http://localhost:3000/test-page.html
```

Notes:

- `web-ext` installs a temporary add-on into a new Firefox profile and opens a window; closing that window does not persist the add-on.
- Install `web-ext` globally with `npm i -g web-ext` if you don't have it already.

## Testing the Extension

### Automated Testing

Run the WebAssembly engine test:

```bash
node test-engine.js
```

This tests the core matching logic without needing to load the extension.

### Manual Testing

1. Load the extension in Chrome/Edge as described above.
2. Open the extension popup and create a profile with your information.
3. Select the profile to use for autofilling.
4. Open `test-form.html` in your browser (or visit a supported job site).
5. The extension should automatically fill matching form fields.

### Debug Mode

To enable debug logging, temporarily uncomment the `console.log` statements in:

- `apps/extension/src/content/index.ts`
- `apps/extension/src/background/index.ts`

Then rebuild and reload the extension to see detailed logs in the browser console.

## Current Message Flow

1. Content script extracts form fields (`input`, `select`, `textarea`).
2. Content script sends `ANALYZE_FORM` to background.
3. Background initializes `core-wasm` and calls `analyze_form(domPayload, profilePayload)`.
4. Returned actions are applied in content script.

## Useful Commands

From repo root:

```bash
pnpm wasm:clean
pnpm wasm:build
pnpm build:extension
pnpm build:popup
```

## Current Status

This repo has end-to-end functionality with profile management implemented.

Features:

- Profile creation, editing, deletion, and selection via popup UI
- Profiles stored in `chrome.storage.sync`
- Content script uses selected profile for autofilling
- Fuzzy matching in Rust engine for name, email, phone fields
- Actions applied to matching form fields

The extension can now autofill job application forms using user-defined profiles.
