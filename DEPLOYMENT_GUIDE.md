# Deployment Guide - Render.com

## ✅ Code Pushed to GitHub
Your latest changes have been pushed to: `https://github.com/Jsanchez767/matic-platform`

## 🚀 Deploy to Render

### Option 1: Deploy Backend (Recommended First)

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Jsanchez767/matic-platform`
   - Render should auto-detect `render.yaml`

3. **Backend Configuration** (if not using render.yaml):
   - **Name**: `matic-backend` (or your choice)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables** (Critical!):
   ```
   DATABASE_URL=postgresql+asyncpg://[your-supabase-connection-string]
   DEBUG=false
   SUPABASE_URL=[your-supabase-url]
   SUPABASE_ANON_KEY=[your-supabase-anon-key]
   PYTHON_VERSION=3.11.0
   ```

   **Get Supabase Connection String**:
   - Go to Supabase Dashboard → Project Settings → Database
   - Copy the "Connection string" for "Connection pooling"
   - Format: `postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

5. **Deploy**: Click "Create Web Service"

### Option 2: Deploy Frontend (After Backend)

**Render Frontend**:
1. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Connect repository: `Jsanchez767/matic-platform`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`

2. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://matic-backend.onrender.com/api
   NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
   ```

**Alternative - Vercel (Recommended for Next.js)**:
1. Go to https://vercel.com/
2. Import GitHub repository
3. Vercel auto-detects Next.js configuration
4. Add environment variables
5. Deploy

### Option 3: Use Render Blueprint (Easiest)

Since you have `render.yaml`, you can:

1. Go to https://dashboard.render.com/
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will read `render.yaml` and set everything up automatically
5. Just add your environment variables

## 🔧 Post-Deployment Configuration

### Update CORS in Backend

Once deployed, update `backend/app/main.py` CORS settings:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://maticsapp.com",
        "https://www.maticsapp.com",
        "https://matic-platform.vercel.app",  # Your Vercel domain
        "https://your-frontend.onrender.com",  # If using Render
        "https://matic-backend.onrender.com",  # Backend itself
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push the changes.

### Test Deployment

1. **Test Backend API**:
   ```bash
   curl https://matic-backend.onrender.com/api/tables
   ```

2. **Test Frontend**:
   - Visit your frontend URL
   - Try logging in
   - Open a workspace
   - Check if tables load

## 📝 Current render.yaml Configuration

Your `render.yaml` is set up for:
- **Service Type**: Web Service (Python)
- **Runtime**: Python 3.11.0
- **Region**: Oregon
- **Plan**: Free tier
- **Auto-deploy**: On push to `main` branch

## 🔍 Troubleshooting

### Backend won't start:
- Check environment variables are set correctly
- Verify DATABASE_URL format: `postgresql+asyncpg://...`
- Check Render logs: Dashboard → Service → Logs

### Frontend can't connect to backend:
- Verify `NEXT_PUBLIC_API_URL` points to backend
- Check CORS settings in `backend/app/main.py`
- Ensure backend is running and accessible

### Database connection fails:
- Verify Supabase connection pooling is enabled
- Use `postgresql+asyncpg://` not `postgresql://`
- Check Supabase project is not paused

## 💡 Tips

1. **Free Tier Limitations**:
   - Render free tier spins down after 15 mins of inactivity
   - First request after spin-down takes 30-60 seconds
   - Consider upgrading for production

2. **Environment Variables**:
   - Never commit sensitive values
   - Use Render's environment variable manager
   - Redeploy after changing env vars

3. **Monitoring**:
   - Check Render logs regularly
   - Set up health check endpoint
   - Monitor Supabase database connections

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Add your domain in Render settings
   - Update DNS records
   - Update CORS settings

2. **CI/CD**:
   - Already set up! Push to `main` auto-deploys

3. **Database Migrations**:
   - Use Alembic for schema changes
   - Run migrations via Render shell

4. **Monitoring**:
   - Set up error tracking (Sentry)
   - Add application monitoring
   - Configure alerts

---

**Your deployment is ready!** 🚀

Next: Configure environment variables in Render and click deploy.
