# 🚀 Render Deployment Checklist

## ✅ Completed
- [x] Code pushed to GitHub: `Jsanchez767/matic-platform`
- [x] API endpoints standardized (no trailing slashes)
- [x] Environment variable examples created
- [x] Deployment guide created
- [x] render.yaml configured

## 📋 Next Steps

### 1. Deploy Backend to Render (5-10 minutes)

**Go to Render**: https://dashboard.render.com/

#### Option A: Using Blueprint (Easiest)
1. Click "New +" → "Blueprint"
2. Connect repository: `Jsanchez767/matic-platform`
3. Render auto-reads `render.yaml`
4. Add environment variables:
   ```
   DATABASE_URL=postgresql+asyncpg://[your-connection-string]
   DEBUG=false
   SUPABASE_URL=https://[your-project].supabase.co
   SUPABASE_ANON_KEY=[your-key]
   ```
5. Click "Apply"

#### Option B: Manual Web Service
1. Click "New +" → "Web Service"
2. Connect repository: `Jsanchez767/matic-platform`
3. Configure:
   - Name: `matic-backend`
   - Region: Oregon
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (same as above)
5. Click "Create Web Service"

### 2. Get Your Supabase Connection String

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Project Settings** → **Database**
4. Find "Connection string" section
5. Copy **"Connection pooling"** string (not direct connection)
6. Format for Render:
   ```
   postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   Note: Replace `[password]` with your actual database password

### 3. Update CORS After Backend Deploys

Once your backend URL is live (e.g., `https://matic-backend.onrender.com`):

1. Edit `backend/app/main.py`
2. Add your backend URL to CORS origins:
   ```python
   allow_origins=[
       "https://maticsapp.com",
       "https://www.maticsapp.com",
       "https://matic-backend.onrender.com",  # Add this
       "https://matic-platform.vercel.app",    # If using Vercel
       "http://localhost:3000",
   ],
   ```
3. Commit and push:
   ```bash
   git add backend/app/main.py
   git commit -m "Update CORS for production backend URL"
   git push origin main
   ```
4. Render will auto-redeploy

### 4. Deploy Frontend (Choose One)

#### Option A: Vercel (Recommended for Next.js)
1. Go to: https://vercel.com/
2. Click "Add New" → "Project"
3. Import `Jsanchez767/matic-platform`
4. Vercel auto-detects Next.js
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://matic-backend.onrender.com/api
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key]
   ```
6. Click "Deploy"

#### Option B: Render Static Site
1. In Render, click "New +" → "Static Site"
2. Connect repository
3. Configure:
   - Build: `npm install && npm run build`
   - Publish: `.next`
4. Add same environment variables as above
5. Deploy

### 5. Test Your Deployment

1. **Backend Health Check**:
   ```bash
   curl https://matic-backend.onrender.com/api/tables
   ```
   Should return: `{"detail":"Method Not Allowed"}` or similar (not 404)

2. **Frontend Test**:
   - Visit your frontend URL
   - Try logging in with Supabase
   - Create/open a workspace
   - Open a table and verify data loads

### 6. Monitor First Deploy

⚠️ **Important**: Render free tier takes 30-60 seconds for first request after spin-down.

Watch logs in Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Watch for:
   - ✅ "Application startup complete"
   - ✅ Database connection successful
   - ❌ Any error messages

## 🐛 Common Issues & Fixes

### Issue: Backend won't start
- **Check**: DATABASE_URL format must be `postgresql+asyncpg://`
- **Check**: All environment variables are set
- **Check**: Python version matches requirements (3.11+)

### Issue: Frontend can't reach backend
- **Check**: NEXT_PUBLIC_API_URL has `/api` at the end
- **Check**: Backend CORS includes frontend URL
- **Check**: Backend is running (green status in Render)

### Issue: 401 Unauthorized errors
- **Check**: SUPABASE_URL and SUPABASE_ANON_KEY match between frontend and backend
- **Check**: User is logged in to Supabase Auth

### Issue: Slow first load
- **Expected**: Render free tier spins down after 15 mins
- **Solution**: Upgrade to paid tier or accept 30-60s cold starts

## 📊 Deployment Status Tracking

- [ ] Backend deployed on Render
- [ ] Backend URL: `https://_____.onrender.com`
- [ ] Frontend deployed (Vercel/Render)
- [ ] Frontend URL: `https://_____.vercel.app` or `https://_____.onrender.com`
- [ ] CORS updated with production URLs
- [ ] Environment variables configured
- [ ] First test login successful
- [ ] Table data loads correctly

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ Backend responds to API requests
2. ✅ Frontend loads without errors
3. ✅ Login works with Supabase
4. ✅ Workspaces list displays
5. ✅ Tables open and show data
6. ✅ Can add/edit rows

---

**Need Help?**
- Render Docs: https://render.com/docs
- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Review Render logs for specific errors

**Ready to deploy!** 🚀
