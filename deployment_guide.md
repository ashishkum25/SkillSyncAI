# Deployment Guide for SkillSyncAI

Since your application uses a **React/Vite Frontend** and a **Node.js/Express Backend** with Puppeteer, the most optimal way to host it is by splitting the services:

1. **Frontend on Vercel** (Simplest, fastest, and natively built for React/Vite).
2. **Backend on Render** (Best for Node.js apps, especially those using Puppeteer).

I have securely added a `"start": "node server.js"` command to your backend `package.json` to make it production-ready.

---

## Part 1: Host the Backend on Render
The backend needs to be deployed first so we get the Live API URL to put into your frontend environment file.

1. Create an account on [Render](https://render.com/).
2. On your dashboard, click **"New +"** and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and connect your GitHub account. Select the `SkillSyncAI` repository.
4. Fill in the specific settings for the backend:
    - **Name**: `skillsyncai-backend` (or similar)
    - **Language**: Node
    - **Root Directory**: `Backend` (⚠️ *Very Important so Render knows where to look*)
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5. **Environment Variables**:
   Scroll down to the "Environment Variables" section and set up your required `.env` variables (you can find these in your local `/Backend/.env` file). E.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, the API keys, and most importantly add this to make Puppeteer work:
   - `PUPPETEER_CACHE_DIR`: `/opt/render/project/puppeteer`
6. Click **Create Web Service**. 
   > **Note:** Since Puppeteer downloads a large Chromium browser, the initial build may take a few minutes. Wait for the status to turn green (Live) and copy the provided `.onrender.com` URL.

---

## Part 2: Connect Frontend to the New Backend
Before pushing the frontend, you need to point it to your live backend.

1. Open `/Frontend/.env` (if it exists) or replace your local API `BASE_URL` in `/Frontend/src/services/api.js` (or similar request config file) with your newly generated Render URL.
   *Example: `https://skillsyncai-backend.onrender.com/api`*
2. Save the change and commit to your GitHub repository:
   ```bash
   git add .
   git commit -m "Update API URL to production"
   git push origin main
   ```

---

## Part 3: Host the Frontend on Vercel

1. Create an account on [Vercel](https://vercel.com/) and log in with GitHub.
2. Click **"Add New Project"** and import your `SkillSyncAI` repository.
3. Configure the Project:
   - **Framework Preset**: Vercel should automatically detect **Vite**. If not, select Vite.
   - **Root Directory**: Click "Edit" and choose `Frontend`.
   - The build settings (`npm run build`) and output directory (`dist`) should pre-fill automatically.
4. **Environment Variables**: Open the "Environment Variables" toggle and add any variables your frontend needs (e.g., your generic `VITE_API_URL` matching the Render backend URL).
5. Click **Deploy**.

Vercel will quickly run the build and assign you a live `.vercel.app` URL for your Frontend.

---

### You're all set! 🚀
Once both are live, go to your new Vercel URL, and everything should communicate seamlessly! Let me know if you run into any build errors.
