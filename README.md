# Job Autofill

A professional browser extension for managing and automating job application forms.

## Features

- **Profile Dashboard**: Manage multiple application profiles in a full-page interface.
- **Dynamic Mapping**: Map custom keywords to form fields for flexible autofilling.
- **Context Menu**: Right-click any input to fill using a specific profile.
- **Privacy First**: All data is stored locally via `browser.storage`.

## Project Structure

- `apps/extension`: The core browser extension (Background & Content scripts).
- `apps/popup-ui`: React-based management dashboard.
- `packages/core`: Shared TypeScript logic and matching engine.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
pnpm build:core
```

### Dashboard UI Development (with HMR)

```bash
pnpm dev:popup
```

_The dashboard includes a mock storage layer for debugging in a standard browser tab._

### Building the Extension

```bash
pnpm build
```

The final extension will be available in `apps/extension/dist`.

### Testing in Browser

```bash
pnpm launch
```

This starts a test server and runs the extension using `web-ext`.
