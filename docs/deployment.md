# Deploy the complete application

The Vercel project builds the Vite frontend only. `server/index.ts` is a separate
Express process; Vite's development proxy does not exist in a production build.
Without a backend, dashboard, documents, review and upload requests return 404.

## Free portfolio demo (default)

The included `render.yaml` uses Render's **Free** web service without a paid disk.
It restores sample data on startup when the database is empty. Uploaded files,
review decisions and edits are temporary: they disappear on redeploy, restart,
or idle spin-down. This is suitable only for a portfolio demonstration.

Create a Blueprint from this repository, using branch `main`. It must show the
Free instance and no disk before deployment. No paid OpenAI key is required:
the existing fallback extractor supports manual review without an AI API call.
Render can take about a minute to wake after 15 minutes of inactivity.

Set `VITE_TEMPORARY_DEMO=true` on the Vercel frontend as well as
`VITE_API_BASE_URL` so visitors see the temporary-data notice. Redeploy after
changing these build settings. Free usage is subject to hosting limits.

## Optional backend with persistent storage

Keeping documents across restarts requires a separate persistent database and
file store, or a paid persistent disk. The default Blueprint does not provision
either. Do not select a paid service for the free demo.

The container initializes the database before starting Express. Wait for
`https://YOUR-BACKEND/api/health` to return `{"status":"ok"}`. The initial database
is empty; upload a document to populate it. Optionally set `OPENAI_API_KEY` on
the backend only for AI extraction. Without it, deterministic extraction remains
available for manual review.

Other persistent Docker hosts also work. Mount storage at `/app/storage`, set
`DATABASE_URL=file:/app/storage/docuintel.db` and
`UPLOAD_DIR=/app/storage/uploads`, and expose port 3001 (or set `PORT`).

## Connect the existing Vercel frontend

1. In the Vercel project environment settings, set `VITE_API_BASE_URL` to the
   backend HTTPS origin, for example `https://YOUR-BACKEND`. Do not append `/api`.
2. Set it for Production and for Preview if previews should use that backend.
3. Redeploy: Vite embeds this value at build time.
4. Verify Overview, Documents and Review queue load; upload a DOCX; open its
   review, save changes, approve and download JSON/CSV. Export links use the
   same backend address as data requests.
5. Refresh `/documents` directly to verify the SPA routing configuration.

The Docker backend also serves the built frontend, so its own URL can be used
as a complete standalone deployment without Vercel.

Do not use a temporary serverless directory for the database or retained uploads:
data must survive process restarts and deployments. This demo has no login or
authorization; use sample documents only on a public deployment.
