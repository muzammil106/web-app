# Candidate Assessment – Web Application

A mobile-first, vanilla TypeScript web app: multi-step registration form, offer selection, and thank-you summary. Uses **Supabase** (Database + Edge Functions). No React/Vue/Angular/jQuery or UI libraries.

## Tech stack

- **TypeScript** (strict), compiled with Vite
- **HTML & CSS** (mobile-first, responsive)
- **Supabase**: Postgres database + Edge Functions (Deno)
- **Vanilla DOM**: all UI via TypeScript (no frameworks)

## Architecture

- **Domain**: types and constants (`src/domain/types.ts`)
- **Validation**: client-side validators for Step 1, Step 2, and offers (`src/validation/`)
- **Services**: `ApiService` – single responsibility to call Edge Functions (`src/services/api.ts`)
- **UI**: view classes per route – `Step1View`, `Step2View`, `ResultsView`, `ThankYouView` (`src/ui/`)
- **Config**: env loader for `VITE_SUPABASE_*` only (no service keys in frontend)

SOLID: dependency injection (e.g. `ApiService` passed into views), single responsibility per module, validation and API separated from UI.

## Setup

### 1. Install dependencies

```bash
cd web-app
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli) and log in:
   ```bash
   npx supabase login
   ```
3. Link the project (from repo root):
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
4. Run migrations:
   ```bash
   npx supabase db push
   ```
   Or run the SQL in `supabase/migrations/20250221000001_initial_schema.sql` in the SQL Editor.

### 3. Edge Functions

Deploy functions (from repo root):

```bash
npx supabase functions deploy register-user
npx supabase functions deploy get-offers
npx supabase functions deploy submit-offers
npx supabase functions deploy thank-you-data
```

Environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically by Supabase for Edge Functions; do not expose the service role key to the frontend.

### 4. Frontend env

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`: your project URL (e.g. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: project anon/public key (from Supabase dashboard → Settings → API)

Never put the service role key in the frontend.

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Flow: Step 1 → Step 2 → Submit (Edge Function) → Results (offers) → Select offers → Submit (Edge Function) → Thank You.

### 6. Build

```bash
npm run build
```

Output is in `dist/`. Serve with any static host; for client-side routes (`/step2`, `/results`, `/thank-you`) configure SPA fallback (e.g. serve `index.html` for all routes).

## Database schema

- **states**: `id`, `code`, `name` (AL, KY, MA, MN, NJ, NV, OR, SC, TX, WA)
- **users**: registration data (step1 + step2), `state_id` FK to `states`
- **offers**: `name`, `description`, `image_url`, optional `state_id` (null = show to all states)
- **user_offers**: `user_id`, `offer_id` (selected offers)

## Edge Functions

| Function         | Purpose |
|------------------|--------|
| `register-user`  | Validate step1 + step2, insert user, return `userId` |
| `get-offers`     | Accept `stateCode`, return offers for that state (state-restricted + no restriction) |
| `submit-offers`  | Accept `userId` + `offerIds`, upsert `user_offers` |
| `thank-you-data` | Accept `userId`, return user summary + selected offers |

All validate input and use the Supabase service role only on the server.

## Security

- No service keys in frontend; only anon key in env.
- User input sanitized (client and server); output escaped in HTML.
- Validation on client and in Edge Functions.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Start Vite dev server |
| `npm run build`| Type-check + production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests (starts dev server). **First time:** run `npx playwright install chromium` to download the browser. |

## Bonus: Tests

- **Unit tests (Vitest):** `src/validation/*.test.ts` – step1, step2, offers validators. Run: `npm run test`.
- **E2E tests (Playwright):** `e2e/flow.spec.ts` – Step 1 validation and navigation. **Before first run**, install the browser: `npx playwright install chromium`. Then: `npm run test:e2e`.
- **Supabase function tests (Deno):** `supabase/functions/_shared/validation.test.ts` – phone/email regex and allowed states. Run: `deno test supabase/functions/_shared/validation.test.ts --allow-read`.
## Project structure

```
web-app/
├── index.html
├── src/
│   ├── main.ts              # Entry, route dispatch
│   ├── index.css            # Global mobile-first styles
│   ├── config/env.ts        # Load VITE_* config
│   ├── domain/types.ts      # Shared types and constants
│   ├── validation/          # Step1, Step2, offers validators + *.test.ts
│   ├── services/api.ts      # ApiService – Edge Function calls
│   └── ui/                  # Step1View, Step2View, ResultsView, ThankYouView
├── e2e/
│   └── flow.spec.ts         # Playwright E2E tests
├── supabase/
│   ├── migrations/         # Initial schema (states, users, offers, user_offers)
│   ├── functions/           # register-user, get-offers, submit-offers, thank-you-data
│   └── functions/_shared/   # validation.test.ts (Deno)
├── .env.example
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── REQUIREMENTS_CHECKLIST.md
└── README.md
```
