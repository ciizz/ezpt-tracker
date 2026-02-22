PROJECT_ID  ?= ezpt-tracker
REGION      ?= europe-west1
IMAGE        = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/ezpt/app:latest
SECRETS      = DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,SESSION_SECRET=SESSION_SECRET:latest

# ── Local ────────────────────────────────────────────────────────────────────

dev:
	npm run dev

build-local:
	docker build -t ezpt-tracker .

run-local:
	docker run --rm -p 3000:3000 --env-file .env ezpt-tracker

# ── One-time GCP setup ───────────────────────────────────────────────────────

gcp-setup:
	gcloud config set project $(PROJECT_ID)
	gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
	gcloud artifacts repositories create ezpt --repository-format=docker --location=$(REGION)
	gcloud auth configure-docker $(REGION)-docker.pkg.dev

secrets-create:
	grep '^DATABASE_URL='   .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create DATABASE_URL   --data-file=-
	grep '^DIRECT_URL='     .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create DIRECT_URL     --data-file=-
	grep '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create ADMIN_PASSWORD --data-file=-
	grep '^SESSION_SECRET=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets create SESSION_SECRET --data-file=-

secrets-update:
	grep '^DATABASE_URL='   .env | cut -d= -f2- | tr -d '\n' | gcloud secrets versions add DATABASE_URL   --data-file=-
	grep '^DIRECT_URL='     .env | cut -d= -f2- | tr -d '\n' | gcloud secrets versions add DIRECT_URL     --data-file=-
	grep '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets versions add ADMIN_PASSWORD --data-file=-
	grep '^SESSION_SECRET=' .env | cut -d= -f2- | tr -d '\n' | gcloud secrets versions add SESSION_SECRET --data-file=-

grant-secrets:
	$(eval PROJECT_NUMBER := $(shell gcloud projects describe $(PROJECT_ID) --format="value(projectNumber)"))
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
		--member="serviceAccount:$(PROJECT_NUMBER)-compute@developer.gserviceaccount.com" \
		--role="roles/secretmanager.secretAccessor"

# ── Deploy ───────────────────────────────────────────────────────────────────

push:
	docker build --platform linux/amd64 -t $(IMAGE) .
	docker push $(IMAGE)

deploy:
	gcloud run deploy ezpt \
		--image=$(IMAGE) \
		--region=$(REGION) \
		--allow-unauthenticated \
		--set-secrets="$(SECRETS)"

release: push deploy

# ── Ops ──────────────────────────────────────────────────────────────────────

logs:
	gcloud logging read \
		"resource.type=cloud_run_revision AND resource.labels.service_name=ezpt" \
		--project=$(PROJECT_ID) --limit=50 \
		--format="table(timestamp, severity, textPayload)"

migrate:
	npx prisma migrate deploy

.PHONY: dev build-local run-local gcp-setup secrets-create secrets-update grant-secrets push deploy release logs migrate
