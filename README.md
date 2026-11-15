# smartcarrercoach

## Production deployment

The frontend is a Vite app for Vercel, and the Express API is configured as a Render web service.

### Frontend on Vercel

1. Import the repository in Vercel and set the root directory to `client/client`.
2. Set `VITE_API_URL` to the public Render API origin, for example `https://careerpilot-api.onrender.com`.
3. Use the Vercel project configuration in `client/client/vercel.json`. It builds to `dist` and rewrites client-side routes to `index.html`.

### API on Render

1. Create a Blueprint from the repository root using `render.yaml`.
2. Set `MONGO_URI`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` on the API service. Render generates `JWT_SECRET`.
3. After Vercel assigns the frontend URL, set both `CLIENT_URL` and `FRONTEND_URL` to that exact origin, then redeploy the API.

Never commit `.env` or paste production secrets into chat.