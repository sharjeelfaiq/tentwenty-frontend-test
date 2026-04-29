# ticktock Assessment App

Assessment-ready Next.js App Router implementation for a small timesheet workflow. The app keeps the existing feature-based structure and adds cookie-backed auth, protected app routes, shared validation, structured API errors, and a runnable test suite.

## Setup

1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Open `http://localhost:3000/login`

Demo credentials:

- Email: `john@example.com`
- Password: `password123`

Optional environment variables:

- `AUTH_SESSION_SECRET`: overrides the demo cookie-signing secret
- `NEXT_PUBLIC_API_BASE_URL`: keeps API requests relative by default, but can point at another origin if needed

## Scripts

- `npm run dev`: start the Next.js dev server
- `npm run build`: production build
- `npm run start`: run the production server
- `npm run lint`: ESLint across the repo
- `npm run test`: Vitest once
- `npm run test:watch`: Vitest watch mode

## Frameworks / Libraries

- Next.js 16 App Router
- React 19 and React DOM 19
- TypeScript
- Tailwind CSS 4 with PostCSS
- ESLint 9 with `eslint-config-next`
- Vitest, React Testing Library, Testing Library user-event, jest-dom, and jsdom for tests

## Architecture

The app stays organized by feature:

- `src/features/auth`: login UI, auth hooks, and auth service calls
- `src/features/timesheets`: dashboard/detail hooks, pages, and API service wrappers
- `src/app`: App Router entrypoints and route handlers
- `src/lib`: shared validation, auth/session helpers, mock data, API client, and HTTP helpers
- `src/components/shared`: reusable UI primitives

Key implementation details:

- Auth uses an `httpOnly` signed cookie set by `POST /api/auth/login` and cleared by `POST /api/auth/logout`.
- `src/app/(app)/layout.tsx` protects the app area server-side and redirects unauthenticated users to `/login`.
- Validation is handwritten and shared between client hooks and route handlers through `src/lib/validation.ts`.
- Internal APIs return a stable error shape: `{ error, fieldErrors? }`.
- Timesheet data is stored in an in-memory mock store for the active server process, which is enough for assessment/demo behavior.

## Features

- Cookie-based login/logout with protected app routes
- Timesheet dashboard filters with loading, empty, and error states
- Timesheet detail view with add, delete and edit entry flows
- Shared client/server validation for login and entry payloads
- Structured API error propagation through the shared fetch client
- Vitest + React Testing Library coverage for auth, route protection, timesheet UI states, hook submit flows, and API routes

## Assumptions

- Dummy auth is acceptable for the assessment as long as credential validation and cookie persistence are implemented correctly.
- Timesheet persistence only needs to survive for the lifetime of the running server process.
- Delete-entry behavior is intentionally not implemented or advertised as available.

## Verification

Recommended local verification order:

1. Remove stale build output if needed: `Remove-Item -LiteralPath .next -Recurse -Force`
2. Run `npm run lint`
3. Run `npm run test`
4. Run `npm run build`

## Time Spent / Demo Notes

- The demo account is surfaced directly on the login page to reduce evaluator friction.
- The current implementation favors explicit local state and small shared utilities over introducing global state or extra dependencies.
- Time spent: 12 hours.
# tentwenty-frontend-test
