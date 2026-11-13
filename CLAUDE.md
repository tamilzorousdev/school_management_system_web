# CLAUDE.md — School Management Admin Web

React admin console for the Tamilzorous School Management System. It talks only to the backend in `C:\Users\DELL\Telematics` (`/api/v1`). Parents, teachers and drivers use the Flutter app; this web app is for admin roles (school admin, principal, AO, transport in-charge).

## Commands

```bash
npm run dev          # http://localhost:5173, proxies /api to VITE_API_PROXY_TARGET (default http://localhost:3000)
npm run build        # tsc -b && vite build
npm run lint         # must be clean before commit
npm run typecheck
npm run format
```

Sign in with `9876543210`, OTP `123456` (backend in `OTP_MODE=test`). The backend must be running and seeded.

## Stack

React 19, Vite, TypeScript (strict), TanStack Router (code-based routes in `src/router.tsx`), TanStack Query, axios, react-hook-form + zod, Tailwind CSS v4 with theme tokens in `src/styles/index.css`, Radix (dialog, dropdown), lucide-react icons, sonner toasts, Leaflet maps.

## Structure

```
src/
  router.tsx                 routes; /login is public, everything under the _app route needs a session
  config/                    env.ts, nav.ts (menu groups + permission per item), shortcuts.ts
  lib/api/                   client.ts (axios, token header, refresh on TOKEN_EXPIRED), errors.ts (ApiError)
  lib/auth/session.ts        access + refresh token storage, subscribe for sign-out
  components/ui/             primitives: button, input, badge, card, dialog, dropdown-menu, table, skeleton, switch
  components/common/         combobox, page, data-table, insight-cards, list-toolbar, app-modal, form-field, avatar, otp-input, display
  components/layout/         app-layout, app-sidebar, app-header, user-menu, notification-bell
  features/<feature>/        api.ts, search.ts, pages/, components/
  hooks/ providers/
```

## Hard rules

- **No code comments.**
- **Every page works on phone, tablet and desktop.** Lists use `DataTable` (table from `md`, cards below), forms stack to one column on phones, nothing scrolls sideways.
- **Light and dark** come from the CSS tokens (`bg-card`, `text-muted-foreground`, `border`, `text-primary`…). Never hardcode colours in components.
- **Never use the browser's default `<select>`.** Every dropdown is `Combobox` (`components/common/combobox.tsx`): search box on top, 5 rows visible, then scroll. List filters use `FilterSelect`, which wraps it. In forms, wire it with react-hook-form's `Controller`.
- **Search, sort, filters and paging happen on the backend.** Never filter a list in the browser.
- **List state lives in the URL** (`validateSearch` with a zod schema in `features/<feature>/search.ts`), so back/forward and shared links work.
- **Permission checks** use `can(me, 'users.manage')` from `features/auth/api.ts`. Menu items declare `permission` in `config/nav.ts`; the sidebar hides what the user cannot open.
- Prettier style: single quotes, JSX single quotes, no semicolons, 100 columns.
- Keep files component-only so fast refresh works; constants shared between components go in a plain `.ts` file.

## API layer

Each feature has `api.ts` with types, query keys, an `xxxApi` object and hooks:

```ts
export const studentKeys = {
  all: ['students'] as const,
  list: (p: Params) => [...studentKeys.all, 'list', p] as const,
}
export const studentsApi = {
  list: (p: Params) => api.get<Paginated<Student>>('/admin/students', { ...p }),
}
export function useStudents(p: Params) {
  return useQuery({
    queryKey: studentKeys.list(p),
    queryFn: () => studentsApi.list(p),
    placeholderData: keepPreviousData,
  })
}
```

- `api.get/post/patch/delete` unwrap `{ status, message, data }` and return `data`.
- Errors arrive as `ApiError` with `status`, `code` (backend `error`), `message` and `fieldErrors`.
- Mutations that show their own error set `meta: { silent: true }`; otherwise the global toast shows the message.
- Types mirror the backend DTOs exactly (snake_case fields). When the backend changes a payload, update these types and `docs/api-guide.md` in the backend repo.

## Building a list page

1. `search.ts`: zod schema with `page`, `search`, filters, `sort`, `order` (each with `.catch()` so bad URLs fall back).
2. Route in `router.tsx` with `validateSearch`, under `appRoute`; add the menu item in `config/nav.ts` and a shortcut in `config/shortcuts.ts`.
3. Page: `Page` + `PageHeader`, then `InsightCards` (clickable, toggle a URL filter, backed by `GET .../insights`), then a `Card` with `ListToolbar` (`SearchBox`, `FilterSelect`, clear button) and `DataTable` (columns with `sortKey`, `card` for phones, `empty` state with an action, `pagination`).
4. Read and write search with `getRouteApi('/_app/<path>').useSearch()` and `useNavigate({ from })`; reset `page` to 1 when a filter changes.

`features/users/pages/users-page.tsx` is the reference implementation.

## Forms

- `AppModal` with a `formId`; the form uses react-hook-form + `zodResolver`.
- `AppModal` keeps showing its last content while it animates closed, so `{open && <Form />}` inside it is safe (the form still resets on the next open). A raw `Dialog`/`Sheet` does not do this: never unmount its body on close, or the user sees an empty box flash.
- Client rules match the backend DTO rules.
- On submit errors, map `apiError.fieldErrors` to `setError(field, ...)`; use the `code` for special cases (for example `MOBILE_TAKEN`); fall back to a root error message.
- Success: `alerts.success(...)`, close the modal, invalidate the feature's query keys.

## Auth

- `/login` is a two-step OTP flow. Only users whose `apps` include `admin` may stay signed in.
- `session` holds the tokens; the axios interceptor refreshes once on `TOKEN_EXPIRED` and clears the session on any other 401, which sends the user to `/login?redirect=...`.
- `useMe()` is the source for the signed-in user, roles and permissions.

## Gotchas

- React 19 lint rules forbid setting state inside effects and touching refs during render; derive state during render or update refs in an effect (see `SearchBox` in `components/common/list-toolbar.tsx`).
- The dev proxy forwards `/api`; `VITE_API_URL` must stay `/api/v1`.
- Leaflet tiles are colour-inverted in dark mode by CSS in `index.css`.
