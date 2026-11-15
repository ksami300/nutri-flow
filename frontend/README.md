# NutriFlow frontend

## Local development

Install dependencies and start the frontend:

```bash
npm ci
npm run dev
```

Start the backend separately with `npm ci && npm run dev` from `backend/`.
The frontend defaults to `http://localhost:5000/api` in development.

## Production

Set `NEXT_PUBLIC_API_URL` in the Vercel project before building. It must be the
deployed backend's HTTPS origin without a path; the frontend appends `/api`.
Never point a production build at a temporary tunnel.
