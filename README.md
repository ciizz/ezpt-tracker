# EZPT Tracker

Poker session tracker for a regular home game group. Backed by PostgreSQL on Neon.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Prisma** — schema, migrations, type-safe queries
- **PostgreSQL** — via [Neon](https://neon.tech) (serverless)
- **Tailwind CSS v4** — styling
- **iron-session** — httpOnly cookie admin auth
- **zod** — API input validation

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=your-32-char-random-secret-string
```

`DATABASE_URL` is the pooled connection (used at runtime). `DIRECT_URL` is the direct connection (used by Prisma migrations). Both are available from the Neon dashboard.

> **Note:** do not quote values in `.env` — Docker's `--env-file` does not strip quotes.

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Seed the database

Inserts the 8 regular players, 1 guest slot, and 4 game types:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Makefile Reference

All common tasks are available via `make`. `PROJECT_ID` and `REGION` default to the values in the Makefile but can be overridden: `make release PROJECT_ID=my-project`.

| Command | Description |
|---------|-------------|
| `make dev` | Start local dev server |
| `make run-local` | Run production Docker image locally |
| `make gcp-setup` | Enable GCP APIs, create Artifact Registry repo, configure Docker auth |
| `make secrets-create` | Create all secrets in Secret Manager from `.env` (first time only) |
| `make secrets-update` | Push new secret versions from `.env` (after changing a value) |
| `make grant-secrets` | Grant Cloud Run service account access to Secret Manager |
| `make push` | Build `linux/amd64` image and push to Artifact Registry |
| `make deploy` | Deploy the latest image to Cloud Run |
| `make release` | `push` + `deploy` in one shot |
| `make logs` | Tail Cloud Run logs |
| `make migrate` | Run Prisma migrations against Neon |

---

## Admin Access

Navigate to `/login` and enter the password from `ADMIN_PASSWORD` in your `.env`.

Admin users can:
- Create, edit, delete sessions
- Add participants with rebuys and P&L
- Add, edit, archive players

Public users (no login) can:
- View all sessions and session details
- View player profiles and stats
- Filter stats by year and game type

---

## Importing Historical Data

The one-time Excel import has already been run. All historical sessions are in the database.

The import script (`scripts/import-excel.ts`) is kept for reference. It reads `EZPT_tracker.xlsx` using fixed column-letter mapping (A=date, B=game type, C=buy-in, D–S=player rebuys/P&L pairs, T–W=guest columns) and is idempotent — it skips sessions whose exact participant data already exists.

---

## Database Schema

```
Player           — id, name, isGuest, isActive
GameType         — id, name, defaultBuyIn
Event            — id, name, startDate, endDate, description
Session          — id, date, gameTypeId, maxBuyIn, eventId, notes
SessionParticipant — sessionId, playerId, rebuys, profitLoss
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/players` | public | List active players |
| POST | `/api/players` | admin | Create player |
| PATCH | `/api/players/[id]` | admin | Update / archive player |
| GET | `/api/game-types` | public | List game types |
| GET | `/api/sessions` | public | List sessions (filter: year, gameTypeId, playerId) |
| GET | `/api/sessions/[id]` | public | Session detail + participants |
| POST | `/api/sessions` | admin | Create session |
| PUT | `/api/sessions/[id]` | admin | Update session |
| DELETE | `/api/sessions/[id]` | admin | Delete session |
| GET | `/api/stats` | public | All-player stats (filter: year) |
| GET | `/api/stats/[playerId]` | public | Individual player stats (filter: year) |
| GET | `/api/events` | public | List events |
| GET | `/api/events/[id]` | public | Event stats |
| POST | `/api/auth/login` | — | Set admin cookie |
| POST | `/api/auth/logout` | — | Clear admin cookie |
| GET | `/api/auth/me` | — | Check admin status |

---

## Running Migrations

```bash
# Apply all pending migrations
npx prisma migrate dev

# View/edit data in browser UI
npx prisma studio
```

---

## GCP Deployment (Cloud Run + Neon)

The app runs on Cloud Run (serverless containers) backed by [Neon](https://neon.tech) (serverless PostgreSQL). Secrets are stored in Secret Manager. Neon has a free tier and requires no proxy or GCP-specific database setup.

### Architecture

```
Browser → Cloud Run (Next.js container)
              ↓ TLS connection string
           Neon (serverless PostgreSQL)
              ↑
         Secret Manager (DATABASE_URL, DIRECT_URL, ADMIN_PASSWORD, SESSION_SECRET)
              ↑
         Artifact Registry (Docker images)
```

### One-Time Setup

Replace `PROJECT_ID` and `REGION` with your values. Set them as shell variables to reuse across commands:

```bash
export PROJECT_ID=your-project-id
export REGION=europe-west1   # or your preferred region
export IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/ezpt/app:latest
```

#### 1. GCP project setup

```bash
gcloud auth login
gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create ezpt \
  --repository-format=docker \
  --location=$REGION
```

#### 2. Store secrets in Secret Manager

Read values directly from `.env`. Two pitfalls to avoid:
- Do not use `source` or variable expansion — the `&` in connection strings will be mangled by the shell
- Pipe through `tr -d '\n'` to strip the trailing newline — Secret Manager stores it literally, causing string comparison failures at runtime (e.g. password checks always failing)

```bash
grep '^DATABASE_URL='   .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create DATABASE_URL   --data-file=-
grep '^DIRECT_URL='     .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create DIRECT_URL     --data-file=-
grep '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create ADMIN_PASSWORD --data-file=-
grep '^SESSION_SECRET=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create SESSION_SECRET --data-file=-
```

Or simply: `make secrets-create`

To update a secret later:

```bash
grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets versions add DATABASE_URL --data-file=-
```

#### 3. Grant Cloud Run access to secrets

Cloud Run uses the Compute Engine default service account. Grant it Secret Manager read access:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 4. Build and push the Docker image

> **Apple Silicon (M-series) Mac:** you must build for `linux/amd64` — Cloud Run is x86-64 only.

```bash
gcloud auth configure-docker $REGION-docker.pkg.dev

docker build --platform linux/amd64 -t $IMAGE .
docker push $IMAGE
```

#### 5. Deploy to Cloud Run

```bash
gcloud run deploy ezpt \
  --image=$IMAGE \
  --region=$REGION \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,SESSION_SECRET=SESSION_SECRET:latest"
```

Cloud Run prints the service URL on success.

---

### Repeatable Deploy Workflow

```bash
docker build --platform linux/amd64 -t $IMAGE .
docker push $IMAGE

gcloud run deploy ezpt \
  --image=$IMAGE \
  --region=$REGION \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,SESSION_SECRET=SESSION_SECRET:latest"
```

If the Prisma schema changed, run migrations before deploying:

```bash
npx prisma migrate deploy
```

---

### Debugging

Tail live logs:

```bash
gcloud run services logs read ezpt --region=$REGION --limit=50
```

Or query Cloud Logging directly:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ezpt" \
  --project=$PROJECT_ID \
  --limit=50 \
  --format="table(timestamp, severity, textPayload)"
```

---

### Verification

After deploying:

1. `GET https://SERVICE_URL/api/players` — returns player list
2. Navigate to `/login` and enter the `ADMIN_PASSWORD` value from Secret Manager
