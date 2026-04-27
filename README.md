# Amazon Playwright Automation (JavaScript)

## Overview
This project is an end-to-end automation suite for Amazon using Playwright Test Runner with JavaScript (Node.js).

It covers two flows:
- Search `iPhone` -> open first product -> print price -> add to cart (best-effort)
- Search `Samsung Galaxy` -> open first product -> print price -> add to cart (best-effort)

The suite is configured for parallel execution and stable operation for dynamic Amazon pages.

## Project Structure
```text
amazon-playwright/
  tests/
    amazon-iphone.spec.js
    amazon-galaxy.spec.js
  playwright.config.js
  package.json
  README.md
```

## Prerequisites
- Node.js 18+ (recommended)
- npm
- Brave Browser installed at:
  - `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`

## Setup
```bash
npm install
npx playwright install
```

## Run Tests
Run full suite:
```bash
npx playwright test
```

Run single-worker debug mode:
```bash
npx playwright test --workers=1
```

Run headed mode:
```bash
npx playwright test --headed --workers=1
```

Run individual specs:
```bash
npx playwright test tests/amazon-iphone.spec.js
npx playwright test tests/amazon-galaxy.spec.js
```

## Execution and Parallelism
In `playwright.config.js`:
- `fullyParallel: true`
- `workers: 2`

So default runs execute tests in parallel unless you override with `--workers=1`.

## Browser Configuration
- Local project: `brave-local`
- Engine: Chromium via Playwright
- Executable path points to Brave app
- `headless: false` for visual debugging

## Stability Design Used
To reduce flakiness on Amazon:
- Uses Playwright locators (no raw query selectors)
- No hardcoded waits (`setTimeout`)
- Uses explicit waits with timeouts
- Handles possible new-tab navigation
- Directly opens search pages (`/s?k=<query>`) instead of homepage flow
- Dismisses `International Shopping Transition Alert` if present

## Add-to-Cart Behavior (Important)
On `amazon.com`, non-US sessions may be redirected to sign-in during cart actions.

Current behavior is best-effort:
- If cart confirmation appears -> success
- If redirected to `/ap/signin` -> treated as expected gated behavior
- If cart button is absent on selected listing -> log and continue

This keeps test runs stable in India-region sessions.

## Reporting and Debug Artifacts
Current config enables:
- `trace: 'on'`
- `video: 'on'`
- `screenshot: 'on'`

Generated folders:
- `test-results/`
- `playwright-report/`

These are re-created on every run and are safe to delete between runs.

Open HTML report:
```bash
npx playwright show-report
```

## Optional LambdaTest Execution
LambdaTest project is guarded and does **not** run by default.

Enable only when needed:

1) Set credentials in `.env` (or export):
```bash
LT_USERNAME="your_lambdatest_username"
LT_ACCESS_KEY="your_lambdatest_access_key"
```

2) Run with explicit flag + project:
```bash
RUN_LAMBDATEST=true npx playwright test --project=chromium-lambdatest
```

By default, local runs execute only `brave-local`, even if LT credentials exist.

## LambdaTest Validation Evidence
This suite was also validated on LambdaTest using environment-based credentials from `.env`:
- `LT_USERNAME`
- `LT_ACCESS_KEY`
- run command: `RUN_LAMBDATEST=true npx playwright test --project=chromium-lambdatest`

Build result reference screenshots:
- `Screenshot 2026-04-28 at 01.18.40.png`
- `Screenshot 2026-04-28 at 01.18.50.png`

Inline proof:

![LambdaTest Build Result](./Screenshot%202026-04-28%20at%2001.18.40.png)
![LambdaTest Build Result - Alternate View](./Screenshot%202026-04-28%20at%2001.18.50.png)

## npm Scripts
From `package.json`:
- `npm test` -> `playwright test`
- `npm run test:headed` -> `playwright test --headed`
- `npm run test:iphone` -> iPhone spec only
- `npm run test:galaxy` -> Galaxy spec only
