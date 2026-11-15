# Production deployment

NutriFlow runs as two services:

- Next.js frontend on Vercel, rooted at `frontend/`.
- Express API on Railway, rooted at `backend/`.

## Backend

1. Deploy the `backend/` directory as a Railway service.
2. Configure the required variables from `backend/.env.example` in Railway.
   Use production credentials for MongoDB, JWT, OpenAI, Stripe, and email.
3. Allow Railway to provide `PORT`; the API binds to that exact port.
4. Generate a public HTTPS domain and verify `/api/health`.

## Frontend

1. Deploy `frontend/` to Vercel.
2. Set `NEXT_PUBLIC_API_URL` in the Vercel project environment before building.
   It must be the API's HTTPS origin only, for example:

   ```text
   https://your-backend.up.railway.app
   ```

   The frontend appends `/api`. Do not include a path or use a temporary tunnel.
3. Set `FRONTEND_URL` in Railway to the deployed Vercel origin so API CORS
   allows the production frontend.
4. Redeploy after changing either service's environment variables.

## Local validation

Use Node.js 24. From separate terminals:

```bash
cd backend
npm ci
npm run dev
```

```bash
cd frontend
npm ci
npm run dev
```

The local frontend defaults to `http://localhost:5000/api`. A production build
fails early if `NEXT_PUBLIC_API_URL` is unset or malformed.

## Temporary public testing with ngrok

On the local computer, configure ngrok and create
`backend/.env.public-test` from `backend/.env.example`. Populate it with
non-production test credentials, including a test database and Stripe test
keys. From the project root, run:

```powershell
.\scripts\start-public.ps1
```

This starts the frontend and backend, tunnels the frontend over HTTPS, and
allows the temporary ngrok origin through the backend's CORS configuration.
The printed URL changes between runs. Keep the script running during testing;
Ctrl+C stops its services and tunnel. Do not expose production credentials or
sensitive data through a temporary public tunnel.
