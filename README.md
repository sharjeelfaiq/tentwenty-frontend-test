# ticktock Assessment App

Next.js App Router implementation for a small authenticated timesheet workflow. The app includes cookie-backed demo auth, protected routes, dashboard filtering and pagination, timesheet detail CRUD, localStorage-backed browser persistence, shared validation, structured API errors, and a Vitest test suite.

## Setup

1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Open `http://localhost:3000/login`

Demo credentials:

- Email: `john@example.com`
- Password: `password123`

Optional environment variables:

- `AUTH_SESSION_SECRET`: overrides the demo cookie-signing secret
- `NEXT_PUBLIC_API_BASE_URL`: keeps API requests relative by default; set this only when the frontend should call another API origin

## Scripts

- `npm run dev`: start the Next.js development server
- `npm run build`: create a production build
- `npm run start`: run the production build
- `npm run lint`: run ESLint
- `npm run test`: run Vitest once
- `npm run test:watch`: run Vitest in watch mode

## Dependencies

Runtime:

- Next.js 16 App Router
- React 19 and React DOM 19
- Tailwind CSS 4 through PostCSS

Development and testing:

- TypeScript
- ESLint 9 with `eslint-config-next`
- Vitest with jsdom
- React Testing Library, Testing Library user-event, and jest-dom

The app does not use a database, KV store, ORM, or external state service.

## Architecture

The project is organized by feature:

- `src/app`: App Router pages, layouts, error/loading states, and route handlers
- `src/features/auth`: login UI, auth hook, and auth service wrapper
- `src/features/timesheets`: dashboard/detail UI, hooks, API service wrappers, and browser persistence helpers
- `src/lib`: mock data, in-memory API seed store, auth/session helpers, validation, HTTP helpers, date/status utilities
- `src/components/shared`: reusable UI primitives
- `src/test`: route, hook, storage, and component tests

Auth uses a signed `httpOnly` cookie set by `POST /api/auth/login` and cleared by `POST /api/auth/logout`. Protected app routes call server-side guards and redirect unauthenticated users to `/login`.

Timesheet API routes still exist and use the in-memory mock store as bootstrap/demo data. Client-side timesheet state is authoritative after hydration.

## Timesheet Persistence

Timesheet persistence is localStorage-only. The browser cache key is `timesheets-store:v1`, and it stores the current user metadata plus the full timesheet list.

State flow:

- Server-rendered pages and API reads provide initial mock data.
- On the client, localStorage is merged with server data, and cached records win when IDs collide.
- Add, edit, and delete operations update React state and localStorage directly.
- Totals and status are derived after every local mutation.
- CRUD does not rely on server persistence and does not call `router.refresh()`, avoiding stale server-rendered data after mutations.

This means persistence survives refreshes, navigation, logout/login, and production server instance changes in the same browser profile. It does not sync across browsers, devices, or cleared browser storage.

## Production Notes

Vercel serverless functions may run on different or restarted instances. The server mock store is therefore not a durable production data source. This app intentionally avoids relying on it for timesheet persistence.

Expected production behavior:

- Auth persists through the signed cookie.
- Timesheet changes persist through browser localStorage.
- A first visit with no localStorage starts from mock seed data.
- If localStorage is cleared, the app returns to the server-provided mock seed data.
- During hydration, server markup may represent seed data briefly, then the client applies the localStorage-authoritative state.

## Features

- Demo login/logout with protected app routes
- Timesheet dashboard with date/status filters, pagination, loading, empty, and error states
- Timesheet detail view with add, edit, and delete entry flows
- Browser-persistent timesheet changes using localStorage
- Shared client/server validation for login and entry payloads
- Weekly hour limit enforcement with derived total hours and status
- Structured API error responses
- Test coverage for auth, route protection, timesheet storage, dashboard/detail hooks, UI states, and API routes

## Verification

Recommended local verification:

1. Run `npm run lint`
2. Run `npm run test`
3. Run `npm run build`

Manual persistence check:

1. Log in with the demo credentials.
2. Add, edit, or delete a timesheet entry.
3. Navigate back to the dashboard and confirm the status/total changed.
4. Hard refresh the detail page and dashboard.
5. Confirm the browser keeps the updated timesheet state.

## Assumptions

- Demo auth is acceptable for the assessment.
- Timesheet persistence is intentionally per-browser localStorage, not shared account storage.
- No external database or hosted cache is required for this implementation.
