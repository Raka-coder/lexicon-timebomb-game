# Deployment Guide

Complete deployment guide for deploying the Word Chain game (Frontend + Backend separately).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel (FE)                            │
│                   React + Vite + shadcn/ui                      │
│              https://your-app.vercel.app                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket + HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Railway (BE)                            │
│              Bun + Hono + Socket.IO + Redis                     │
│              https://your-app.up.railway.app                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Backend Deployment (Railway)

### Prerequisites
- [Railway Account](https://railway.app) (sign up with GitHub)
- [GitHub Repository](https://github.com) with your backend code pushed

### Step 1: Prepare Backend for Railway

#### 1.1 Create Railway Configuration

Create `railway.json` in the backend root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "bun"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "on-failure",
    "restartPolicyAmount": 10
  }
}
```

#### 1.2 Update package.json scripts

The current scripts work, but let's ensure they support Railway:

```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "start": "bun run src/index.ts"
  }
}
```

#### 1.3 Create Procfile (optional but recommended)

Create a file named `Procfile` in the backend root:

```
web: bun run src/index.ts
```

#### 1.4 Environment Variables for Railway

Create `.env.production` for reference:

```env
PORT=3001
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
TIMER_DURATION=15
START_WORD=rumah
ROOM_CODE_LENGTH=5
```

---

### Step 2: Deploy to Railway

#### 2.1 Push to GitHub

```bash
cd backend
git init
git add .
git commit -m "feat: prepare for Railway deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### 2.2 Connect Railway to GitHub

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect Bun as the build tool

#### 2.3 Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click on the **Variables** tab
3. Add these variables:

```
PORT=3001
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
TIMER_DURATION=15
START_WORD=rumah
ROOM_CODE_LENGTH=5
```

> **Important:** Replace `your-frontend.vercel.app` with your actual Vercel URL (you'll set this later)

#### 2.4 Deploy

1. Railway will automatically detect and deploy
2. Wait for build to complete (~1-2 minutes)
3. Your backend will be live at: `https://your-app.up.railway.app`

#### 2.5 Verify Backend

Test your backend health endpoint:

```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "wordCount": 1000,
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

---

### Step 3: Get Backend WebSocket URL

Your backend WebSocket URL for Socket.IO:
- **WebSocket**: `wss://your-app.up.railway.app`
- **HTTP**: `https://your-app.up.railway.app`

---

## Part 2: Frontend Deployment (Vercel)

### Prerequisites
- [Vercel Account](https://vercel.com) (sign up with GitHub)
- Backend deployed and running on Railway

### Step 1: Update Frontend Environment

#### 1.1 Create Production Environment File

Create `frontend/.env.production`:

```env
VITE_WS_URL=wss://your-backend.up.railway.app
VITE_API_URL=https://your-backend.up.railway.app
```

Replace `your-backend.up.railway.app` with your actual Railway deployment URL.

#### 1.2 Update useSocket.ts (if needed)

The current `useSocket.ts` already supports environment variable `VITE_WS_URL`:

```typescript
const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";
```

No changes needed!

#### 1.3 Update CORS in Backend

After getting your Vercel URL, update CORS_ORIGINS in Railway:

```
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

---

### Step 2: Push Frontend to GitHub

```bash
cd frontend
git init
git add .
git commit -m "feat: prepare for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

You can use the same repo (with `backend/` and `frontend/` folders) or separate repos.

---

### Step 3: Deploy to Vercel

#### 3.1 Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your repository
4. Configure the project:

**Framework Preset**: Vite
**Root Directory**: `./frontend` (or your frontend folder)
**Build Command**: `npm run build`
**Output Directory**: `dist`

#### 3.2 Set Environment Variables

In Vercel project settings, add:

```
VITE_WS_URL=wss://your-backend.up.railway.app
```

> **Important:** Use `wss://` for WebSocket, not `https://`

#### 3.3 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Your frontend will be live at: `https://your-app.vercel.app`

---

### Step 4: Final Configuration

After both deployments are complete:

1. **Update Railway CORS** with your actual Vercel URL
2. **Test the complete flow**:
   - Open `https://your-frontend.vercel.app`
   - Create/join a room
   - Verify Socket.IO connection works
   - Play a word chain game

---

## Troubleshooting

### Backend (Railway) Issues

#### Socket.IO not connecting?

1. Check Railway logs:
   ```bash
   railway logs
   ```

2. Verify CORS_ORIGINS includes your Vercel URL

3. Check if WebSocket is enabled in Railway (it should be by default)

#### Cold start issues?

Railway has cold start times. First connection might take a few seconds.

### Frontend (Vercel) Issues

#### Build failing?

1. Check `npm run build` works locally
2. Verify TypeScript: `npm run typecheck`
3. Check for any ESLint errors: `npm run lint`

#### WebSocket connection failing?

1. Verify `VITE_WS_URL` is set to `wss://` (not `https://`)
2. Check browser console for CORS errors
3. Verify backend is running and accessible

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Update `CORS_ORIGINS` in Railway to include frontend URL |
| WebSocket fails | Use `wss://` prefix, not `https://` |
| Build fails | Check TypeScript errors, run `npm run build` locally |
| 404 on API calls | Verify `VITE_API_URL` is set correctly |

---

## Production URLs Format

```
Frontend (Vercel):
  - URL: https://word-chain.vercel.app
  - Web App URL

Backend (Railway):
  - HTTP API: https://word-chain.up.railway.app
  - WebSocket: wss://word-chain.up.railway.app
```

---

## Environment Variables Summary

### Backend (.env for Railway)

```env
PORT=3001
CORS_ORIGINS=https://your-frontend.vercel.app,https://localhost:5173
TIMER_DURATION=15
START_WORD=rumah
ROOM_CODE_LENGTH=5
```

### Frontend (.env for Vercel)

```env
VITE_WS_URL=wss://your-backend.up.railway.app
VITE_API_URL=https://your-backend.up.railway.app
```

---

## Alternative: Using Different Regions

### Railway Regions

Railway deploys to multiple regions. To optimize latency:

1. Go to Railway project settings
2. Select deployment region (closest to your users)
3. Recommended: `Asia Pacific (Singapore)` for Indonesian users

### Vercel Regions

Vercel Edge Network automatically routes to nearest region.

---

## Security Notes

1. **Never expose** `.env` files with secrets
2. **Use environment variables** in both Railway and Vercel
3. **CORS**: Only allow your frontend domain in production
4. **WebSocket**: Use `wss://` in production, never `ws://`

---

## Next Steps After Deployment

1. Set up custom domain (optional)
   - Vercel: Add custom domain in project settings
   - Railway: Add custom domain in project settings

2. Enable automatic deployments
   - Both Vercel and Railway support auto-deploy on Git push

3. Monitor performance
   - Vercel Analytics
   - Railway Metrics

---

## Quick Reference Commands

### Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Open in browser
railway open

# Add environment variable
railway variables set PORT=3001
```

### Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs your-project
```