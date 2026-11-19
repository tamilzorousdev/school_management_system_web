# School Admin Web

Admin web for the Tamilzorous School Management System. It talks to the School API (`C:/Users/DELL/Telematics`). Bus positions come from the separate Telematics service through the School API; this app never calls the Telematics service or an MQTT broker directly.

Stack: Vite, React 19, TypeScript (strict), Tailwind CSS 4, TanStack Router and Query, axios, react-hook-form with zod, Leaflet.

## Run

```bash
npm install
cp .env.example .env
npm run start:local:win
```

- Start the School API first (port 3000). Bus tracking also needs the Telematics service (port 3001); every other page works without it.
- The terminal prints a `Local` and a `Network` URL. Share the Network URL, for example `http://192.168.1.71:5173`, with anyone on the same network.
- API calls go to `/api` and Vite forwards them to `VITE_API_PROXY_TARGET`, so teammates only need the frontend URL.

## Environment

| Variable                        | Default               | Purpose                                              |
| ------------------------------- | --------------------- | ---------------------------------------------------- |
| `VITE_APP_NAME`                 | Tamilzorous School    | App name                                             |
| `VITE_PORT`                     | 5173                  | Dev server port                                      |
| `VITE_API_URL`                  | /api/v1               | API base path used by the browser                    |
| `VITE_API_PROXY_TARGET`         | http://localhost:3000 | School API address the dev server forwards `/api` to |
| `VITE_TIMEZONE`                 | Asia/Kolkata          | Time zone for displayed times                        |
| `VITE_REFRESH_INTERVAL_SECONDS` | 10                    | Auto-refresh interval for live bus data              |

## Pages

| Group         | Pages                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview      | Dashboard: students, applications, staff, buses moving, live bus map                                                                                                                                                                                             |
| People        | Students (profile with documents, health, behaviour), Admissions, Parents, Staff, Teacher assignments                                                                                                                                                            |
| Communication | Notifications outbox; Announcements (everyone, parents, staff, classes or chosen students and staff, with PDF and image attachments, edit after sending, who read it per child); Events (month and list calendar, parent replies per child, automatic reminders) |
| Fleet         | Bus tracking: live status (moving, stopped, offline), map, recent positions (read-only)                                                                                                                                                                          |
| Settings      | School setup, Schools (super admin), Users and access                                                                                                                                                                                                            |

## Keyboard shortcuts

Press `Shift + ?` in the app for the full list. `G` then a letter jumps to a page (for example `G S` students, `G T` staff, `G B` bus tracking).

## Regression tests

`npm run test:regression` runs the API checks, the browser checks (Chrome via Playwright) and the backend unit tests, then rebuilds the Excel trackers in `C:/Users/DELL/Unit Testing/School Management System` and `C:/Users/DELL/Unit Testing/Telematics Service`, and removes the test records it created. Scripts are in `e2e/`.

## Structure

```
src/
  main.tsx, router.tsx        bootstrap and routes (pages are lazy-loaded)
  config/                     env, navigation, shortcut list
  lib/api/                    axios client, ApiError + toApiError, query client
  lib/                        alerts (toasts), formatting, files, utils
  components/ui/              Button, Card, Input, Dialog, Sheet, Table, Badge, Switch, Skeleton
  components/common/          Page, DataTable, InsightCards, Combobox, AppModal, DocumentList, FleetMap, ...
  components/layout/          sidebar, header, school switcher, toaster
  features/<name>/            api.ts (types + query hooks), components/, pages/
e2e/                          regression scripts and Excel tracker builder
```

## Error handling

- Every request goes through `lib/api/client.ts`. Its interceptor turns every failure into an `ApiError` with `status`, `code` and `message`, read from the backend's `{ status, error, message }` body.
- Network problems and timeouts become clear messages.
- Failed queries and mutations show one toast through `lib/alerts.ts`, unless they set `meta: { silent: true }` and handle the error themselves. For example, the device form shows "This IMEI is already registered" under the IMEI field.

## Scripts

| Script                          | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `start:local:win` / `dev`       | Dev server on the local network    |
| `build` / `preview`             | Production build and local preview |
| `lint` / `format` / `typecheck` | ESLint, Prettier, TypeScript       |
