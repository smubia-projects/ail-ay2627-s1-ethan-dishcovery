# Dishcovery

A mobile-first web app that helps working adults with kidney disease, diabetes or hypertension find nearby places to eat, and the specific dishes that fit their limits. First launch area: Singapore CBD and SMU.

Hack-day demo. Not medical advice. Food allergies are out of scope.

## Layout

| Path | What it is |
|---|---|
| `src/shared` | Types and Zod schemas shared by API and UI (nutrients, venues, profile, match results) |
| `src/backend` | Express API (Cloud Run). `app/services/matching` is the pure matching engine (the safety rules live here) |
| `src/frontend` | Vite, React, TypeScript, Tailwind, shadcn/ui, Leaflet (Vercel) |
| `docs/` | Requirements decisions, clinical rules, data spike findings |
| `data/venues`, `data/published`, `data/upload`, `data/coupons` | Venue locations, MUIS halal list, the upload sheet `upload/dishes.csv` (dishes and nutrients, you fill it in; see docs/06), and the demo coupons |
| `data/spike` | Earlier research on estimating nutrients (USDA FoodData Central). Not used by the app. `data/raw` is gitignored |

## Run it

```bash
npm install
```

The API reads its config from the environment (see `.env.example`) and the catalog from the files under `data/` at startup and serves it from memory; there is no database.

```bash
CORS_ORIGINS=http://localhost:5173 npm run dev:api    # Express API on :8080 (set DEMO_COUPONS=true for the coupons demo)
npm run dev:web                                     # Vite on :5173, proxies /api to :8080
```

Checks:

```bash
npm test
npm run typecheck
npm run build:web        # the site, into src/frontend/dist
npm run build:api        # the API bundle, dist/server.mjs
npm run smoke:api -- http://127.0.0.1:8080   # health, match, bad request, 404 against a running API
```

## Deploy (AI Lodge stack)

| Part | Where | How |
|---|---|---|
| API (`src/backend`) | Cloud Run, service `ail-ay2627-s1-ethan-dishcovery` | `.github/workflows/deploy.yml` on push to `main`: builds the root `Dockerfile` (context = repo root; the `data/` files are baked into the image), pushes to Docker Hub, deploys with env from the `DOTENV` secret |
| Site (`src/frontend`) | Vercel | Import the repo with the **root directory left at the repo root** (the site uses the `src/shared` workspace). `vercel.json` runs `npm run build:web` and serves `src/frontend/dist`. Set `VITE_API_BASE` to the Cloud Run URL |

Backend env (`.env` -> `gh secret set DOTENV --repo smubia-projects/ail-ay2627-s1-ethan-dishcovery < .env`):
`CORS_ORIGINS` (the Vercel URL), `DEMO_COUPONS` (`true`/`false`). Cloud Run sets `PORT`; the image sets `DATA_DIR`.
Vercel env: `VITE_API_BASE`.

Changing a data file means committing and pushing, which rebuilds the API image. A bad data file stops the API at startup and names the file in the Cloud Run logs.

After three successful searches the site shows a one-time, dismissible AI Lodge engagement card (counter in `localStorage`, key `ail-ay2627-s1-ethan-dishcovery:matches`). It never blocks the app.
