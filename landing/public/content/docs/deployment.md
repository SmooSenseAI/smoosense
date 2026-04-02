# Deploy SmooSense as a Web Service

SmooSense can be deployed as a persistent web service so your team can access data from any browser — no local installation required.

## Example files

Three files are all you need:

| File | Purpose |
|------|---------|
| `app.py` | Flask application entry point |
| `Dockerfile` | Container image definition |
| `Makefile` | Convenience commands |

---

### `app.py`

<!-- $include: deploy/app.py -->

---

### `Dockerfile`

<!-- $include: deploy/Dockerfile -->

---

### `Makefile`

<!-- $include: deploy/Makefile -->

---

## Quick start

```bash
make run
```

Open `http://localhost:8000` in your browser.

## With S3 access

Forward your AWS credentials into the container so SmooSense can read S3 paths:

```bash
make run-s3 AWS_PROFILE=my-profile
```

See [Configuration](/docs/configuration/) for S3-compatible storage (Cloudflare R2, MinIO, etc.).

## With authentication

Set Auth0 environment variables to restrict access to your team:

```bash
docker run --rm \
  -p 8000:8000 \
  -e AUTH0_DOMAIN="your-tenant.auth0.com" \
  -e AUTH0_CLIENT_ID="your-client-id" \
  -e AUTH0_CLIENT_SECRET="your-client-secret" \
  -e APP_SECRET_KEY="a-random-secret-key" \
  smoosense-app
```

See [Authentication](/docs/authentication/) for the full Auth0 setup guide.

## With local folder access

By default, local folder browsing is allowed when accessing SmooSense from localhost and denied from any other host. When deploying as a shared web service, you can control this explicitly with `SMOOSENSE_LOCAL_FOLDER_PATTERN`:

**Deny all local paths** (recommended for public-facing deployments):

```bash
docker run --rm -p 8000:8000 -e SMOOSENSE_LOCAL_FOLDER_PATTERN="" smoosense-app
```

**Allow a specific mount point** (e.g. a shared NFS or EFS volume at `/mnt/data`):

```bash
docker run --rm -p 8000:8000 \
  -v /mnt/data:/mnt/data:ro \
  -e SMOOSENSE_LOCAL_FOLDER_PATTERN="/mnt/data/" \
  smoosense-app
```

Users will only be able to browse paths that start with `/mnt/data/`; all other local paths are blocked.

**Allow all local paths**:

```bash
docker run --rm -p 8000:8000 -e SMOOSENSE_LOCAL_FOLDER_PATTERN="*" smoosense-app
```

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the app listens on | `8000` |
| `AWS_PROFILE` | AWS credentials profile for S3 access | — |
| `AWS_ENDPOINT_URL` | Endpoint for S3-compatible storage | — |
| `AWS_ACCESS_KEY_ID` | AWS access key (alternative to profile) | — |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (alternative to profile) | — |
| `AUTH0_DOMAIN` | Auth0 tenant domain | — |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | — |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | — |
| `APP_SECRET_KEY` | Flask session secret key (auto-generated if unset) | — |
| `SMOOSENSE_LOCAL_FOLDER_PATTERN` | Controls local folder access. Unset: auto-detect (allowed on localhost, denied elsewhere). `""`: deny all. `*`: allow all. `/prefix/`: allow only paths starting with the prefix. | unset |
