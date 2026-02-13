# Job Autofill

Monorepo for a Manifest V3 browser extension that autofills job application forms (for example Workday) using a Rust + WebAssembly matching engine.

## Workspace Layout

- `crates/engine`: Rust WebAssembly core (`wasm-bindgen` exports)
- `packages/core-wasm`: Generated wasm-pack output consumed by apps
- `apps/extension`: Manifest V3 extension (background + content scripts)
- `apps/popup-ui`: Placeholder popup UI (Vite + React)

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

## Load Extension in Firefox (Temporary Add-On)

1. Open Firefox and go to `about:debugging`.
2. Click **This Firefox** (on the left sidebar).
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file inside [`apps/extension/dist`](./apps/extension/dist).

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

This repo is scaffolded and wired end-to-end for build/import, with placeholder matching logic in Rust (`analyze_form` currently returns an empty actions list).

Next implementation targets:

- Parse DOM/profile payloads in Rust
- Add fuzzy matching + scoring in `crates/engine/src/matcher.rs`
- Return concrete `set_value` actions for content script execution
- Add profile persistence in extension storage
