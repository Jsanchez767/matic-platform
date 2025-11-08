# Deployment Guide

**⚠️ IMPORTANT**: This is a **monorepo** with both frontend (Next.js) and backend (Go). Make sure to configure each service correctly!

- **Backend**: Deploy from `go-backend/` directory using Docker
- **Frontend**: Deploy from root using Next.js (Vercel)

This guide will walk you through deploying Matic Platform to production.

---

## 📋 Overview

- **Backend**: Render.com (Go + Docker)
- **Frontend**: Vercel (Next.js)
- **Database**: Supabase (already set up)

---

## 🚀 Deploy Backend to Render

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Connect your GitHub account

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Click **"Next"**
4. Find and select `matic-platform` repository
5. Click **"Connect"**

### Step 3: Configure Service (IMPORTANT!)

Render will auto-detect Node.js - **ignore this**. Manually configure:

- **Name**: `matic-backend`
- **Region**: Choose closest to your users (e.g., Oregon)  
- **Branch**: `main`
- **Root Directory**: `go-backend` ⚠️ **CRITICAL**
- **Environment**: **Docker** ⚠️ **CRITICAL - Select from dropdown**
- **Instance Type**: **Free** (or upgrade as needed)

**Do NOT use** the auto-detected build command. Select **Docker** as the environment.

### Step 4: Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db.PROJECT.supabase.co:5432/postgres` | From Supabase |
| `PORT` | `8000` | Auto-set by Render |
| `GIN_MODE` | `release` | Production mode |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Update after Vercel deploy |
| `SUPABASE_URL` | `https://PROJECT.supabase.co` | From Supabase |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase settings (optional) |

**To get Supabase credentials**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes for first deploy)
3. Once deployed, you'll get a URL like: `https://matic-backend.onrender.com`

### Step 6: Test Backend

```bash
# Test health endpoint
curl https://matic-backend.onrender.com/health

# Should return: {"status":"ok"}
```

### Step 7: Update CORS

1. Go back to Render dashboard
2. Find your service → **Environment**
3. Update `CORS_ORIGINS` to include your Vercel frontend URL (after deploying frontend)
4. Save changes (triggers auto-redeploy)

---

## 🎨 Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find `matic-platform` repository
3. Click **"Import"**

### Step 3: Configure Project

Vercel auto-detects Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://PROJECT.supabase.co` | From Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase API settings |
| `NEXT_PUBLIC_API_URL` | `https://matic-backend.onrender.com/api/v1` | Your Render backend URL |

**Important**: All frontend env vars MUST start with `NEXT_PUBLIC_`

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Once deployed, you'll get a URL like: `https://matic-platform.vercel.app`

### Step 6: Update Backend CORS

Now that you have your Vercel URL:

1. Go back to **Render dashboard**
2. Open your backend service
3. Go to **Environment**
4. Update `CORS_ORIGINS`:
   ```
   https://matic-platform.vercel.app,https://www.matic-platform.vercel.app
   ```
5. Save (auto-redeploys)

### Step 7: Test Everything

Visit your Vercel URL and test:
- ✅ Login works
- ✅ Can create workspace
- ✅ Can access data tables
- ✅ No CORS errors in browser console

---

## 🔄 Auto-Deployments

### Backend (Render)

Every push to `main` branch automatically triggers deployment:
```bash
git push origin main
# Render detects changes and redeploys
```

### Frontend (Vercel)

Every push to `main` branch automatically triggers deployment:
```bash
git push origin main
# Vercel detects changes and redeploys
```

---

## 🔧 Custom Domains (Optional)

### Backend Custom Domain (Render)

1. Go to your service in Render
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS instructions
5. Update `CORS_ORIGINS` with new domain

### Frontend Custom Domain (Vercel)

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS instructions
5. Vercel auto-configures SSL

---

## 📊 Monitoring & Logs

### Render Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. View real-time logs
4. Filter by date/time

### Vercel Logs

1. Go to your project dashboard
2. Click **"Deployments"**
3. Select a deployment
4. View **"Build Logs"** or **"Function Logs"**

---

## 🐛 Troubleshooting

### Backend not starting on Render

**Check logs**:
1. Go to service → **Logs**
2. Look for errors

**Common issues**:
- ❌ Missing environment variables
- ❌ Invalid `DATABASE_URL`
- ❌ Dockerfile path incorrect

**Solution**:
1. Verify all env vars are set
2. Check Docker build logs
3. Ensure `go-backend/Dockerfile` exists

### Frontend build failing on Vercel

**Check build logs**:
1. Go to **Deployments**
2. Click failed deployment
3. Review **"Build Logs"**

**Common issues**:
- ❌ Missing `NEXT_PUBLIC_` prefix on env vars
- ❌ TypeScript errors
- ❌ Missing dependencies

**Solution**:
1. Ensure env vars have `NEXT_PUBLIC_` prefix
2. Run `npm run type-check` locally
3. Run `npm run build` locally first

### CORS errors in browser

**Symptoms**:
```
Access to fetch at 'https://backend...' from origin 'https://frontend...' 
has been blocked by CORS policy
```

**Solution**:
1. Go to Render → your service → **Environment**
2. Update `CORS_ORIGINS` to include BOTH:
   ```
   https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
3. Include ALL Vercel preview URLs if needed

### API requests fail with 404

**Check**:
1. Verify `NEXT_PUBLIC_API_URL` includes `/api/v1`
2. Backend is running (visit health endpoint)
3. No trailing slashes in API URL

**Solution**:
```bash
# Correct
NEXT_PUBLIC_API_URL=https://backend.onrender.com/api/v1

# Wrong
NEXT_PUBLIC_API_URL=https://backend.onrender.com/api/v1/
```

---

## 💰 Cost Estimate

### Free Tier (Development)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Render | Free | $0/mo | 750 hrs/mo, sleeps after 15min |
| Vercel | Hobby | $0/mo | 100GB bandwidth |
| Supabase | Free | $0/mo | 500MB database, 2GB bandwidth |

**Total**: $0/month

### Paid Tier (Production)

| Service | Plan | Cost | Benefits |
|---------|------|------|----------|
| Render | Starter | $7/mo | Always on, no sleep |
| Vercel | Pro | $20/mo | 1TB bandwidth, advanced analytics |
| Supabase | Pro | $25/mo | 8GB database, 50GB bandwidth |

**Total**: ~$52/month

---

## ✅ Deployment Checklist

Before going live:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set correctly
- [ ] CORS configured properly
- [ ] Database schema applied in Supabase
- [ ] Health endpoint returns 200
- [ ] Can login to frontend
- [ ] Can create/read/update/delete data
- [ ] No errors in browser console
- [ ] No errors in Render logs
- [ ] SSL certificates active (auto)
- [ ] Custom domains configured (optional)
- [ ] Monitoring/alerts set up (optional)

---

## 🎉 You're Live!

Your URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Docs**: Coming soon (Swagger)

Share your app and start building! 🚀

---

## 📚 Next Steps

1. **Set up monitoring**: Use Render metrics + Vercel analytics
2. **Add Swagger docs**: For API documentation
3. **Enable caching**: Redis for performance
4. **Set up CI/CD**: Automated testing before deploy
5. **Add error tracking**: Sentry or similar
6. **Database backups**: Configure in Supabase
7. **Load testing**: Test with expected traffic

---

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.
