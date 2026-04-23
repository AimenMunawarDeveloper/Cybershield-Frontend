# Playwright E2E Suite

This folder contains comprehensive end-to-end coverage scaffolding for CyberShield main functionality.

## What is covered

- Public smoke checks (`/`, `/sign-in`)
- Authenticated main flows for:
  - affiliated user
  - client admin
  - system admin
- Backend/public API availability checks

## Required environment variables for authenticated E2E

Set these before running tests if you want authenticated role coverage:

- `E2E_SYSTEM_ADMIN_EMAIL`
- `E2E_SYSTEM_ADMIN_PASSWORD`
- `E2E_CLIENT_ADMIN_EMAIL`
- `E2E_CLIENT_ADMIN_PASSWORD`
- `E2E_AFFILIATED_EMAIL`
- `E2E_AFFILIATED_PASSWORD`

Optional:

- `E2E_BASE_URL` (default: `http://127.0.0.1:3001`)
- `E2E_FRONTEND_PORT` (default: `3001`)
- `E2E_BACKEND_PORT` (default: `5001`)
- `NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:5001/api`)
- `NEXT_PUBLIC_BACKEND_URL` (default: `http://127.0.0.1:5001`)

If role credentials are missing, role-specific tests are automatically skipped.

## Commands

- Install browsers: `npm run e2e:install`
- Run full E2E: `npm run e2e`
- Run headed: `npm run e2e:headed`
- Run UI mode: `npm run e2e:ui`
- Open HTML report: `npm run e2e:report`

## Notes

- Playwright starts both backend and frontend dev servers via `playwright.config.ts`.
- Authentication state is generated in `e2e/.auth` by `global-setup.ts`.
