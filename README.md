# Job Autofill

<div align="center">

<img src="apps/extension/icons/logo.svg" alt="Job Autofill Animated Logo" width="256" />

A browser extension for managing and autofilling job application forms.

</div>

| ![Onboarding Screen](assets/onboarding.png) | ![Profile Dashboard](assets/profiles.png) |
| :-----------------------------------------: | :---------------------------------------: |

> [!IMPORTANT]  
> This is a learning experiment and for my personal use.  
> Not intended for public use. **Use at your own risk.**  
> The code is made available for critique, as-is, without any warranties.  
> Feature requests are _highly likely_ to be ignored.

Available on Firefox and Chromium-based browsers.

[<img src="https://raw.githubusercontent.com/kitswas/VirtualGamePad/refs/heads/main/assets/badge_Github_download.svg" alt="Get it on GitHub" style="height:4em;"> ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/kitswas/job-autofill/total) ![GitHub Latest Release](https://img.shields.io/github/v/release/kitswas/job-autofill?logo=github)](https://github.com/kitswas/job-autofill/releases)

[![Firefox Add-on](https://extensionworkshop.com/assets/img/documentation/publish/get-the-addon-178x60px.dad84b42.png)](https://addons.mozilla.org/en-GB/firefox/addon/job-autofill/)

## Features

- **Profile Dashboard**: Manage multiple application profiles in a full-page interface.
- **Dynamic Rules**: Define custom keywords to match form fields for flexible autofilling.
- **Context Menu**: Right-click any input to fill using a specific profile.
- **Privacy First**: All data is stored locally via `browser.storage`.

## Project Structure

- `apps/extension`: The core browser extension (Background & Content scripts).
- `apps/popup-ui`: React-based management dashboard.
- `packages/core`: Shared TypeScript logic and matching engine.

## Development

### Prerequisites

- [Node.js (LTS, use nvm to manage node versions)](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install -r
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

### Automated End-to-End Testing

Uses Playwright, tests on Firefox and Chromium.

```bash
pnpm test:e2e
# To see test results in a browser:
pnpm test:e2e:report
```

### Launch Browser for Testing (Manual)

```bash
pnpm launch
```

This starts a test server and runs the extension using `web-ext`.

### Dependency Graph

![Dependency Graph](docs/dependency-graph.svg)
