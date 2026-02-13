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

## Using the Extension

1. Load the extension as described above.
2. Click the extension icon to open the popup.
3. Create profiles with your information (name, email, phone).
4. Select a profile to use for autofilling.
5. Navigate to a job application form (currently supports Workday).
6. The extension will automatically detect and fill matching fields.

The popup UI allows you to manage multiple profiles for different applications or variations of your information.

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
