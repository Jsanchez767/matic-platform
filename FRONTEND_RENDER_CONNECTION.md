# 🔧 Frontend → Render Backend Connection

## What I Just Did

Updated your `.env.local` to point to your Render backend:

```env
NEXT_PUBLIC_API_URL=https://matic-backend.onrender.com/api
```

## Next Steps

### 1. Verify Your Render Backend URL

1. Go to: https://dashboard.render.com/
2. Find your "matic-backend" service
3. Copy the URL (should be like `https://matic-backend-xxxx.onrender.com`)

**If your URL is different**, update `.env.local`:
```bash
# Open in VS Code or nano
nano /Users/jesussanchez/Downloads/matic-platform/.env.local

# Change the URL to your actual Render URL
NEXT_PUBLIC_API_URL=https://YOUR-ACTUAL-URL.onrender.com/api
```

### 2. Restart Your Frontend

The frontend needs to restart to pick up the new environment variable:

```bash
# Press Ctrl+C to stop the current dev server (if running)
# Then restart:
cd /Users/jesussanchez/Downloads/matic-platform
npm run dev
```

### 3. Test the Connection

Once your frontend restarts, go to your app in the browser and:
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to "Network" tab
3. Try adding a column again
4. Look for the request - it should now go to `https://matic-backend.onrender.com/api/...`

### 4. Check for CORS Issues

If you get a CORS error, you need to add your frontend URL to the backend's CORS settings:

1. Open `backend/app/main.py`
2. Add your frontend URL to the `allow_origins` list:
   ```python
   allow_origins=[
       "https://maticsapp.com",
       "https://www.maticsapp.com",
       "http://localhost:3000",  # For local dev
       # Add if using Vercel:
       # "https://matic-platform.vercel.app",
   ],
   ```
3. Commit and push (Render will auto-deploy)

## Important: First Request May Be Slow

⚠️ **Render Free Tier** spins down after 15 minutes of inactivity. The first request after spin-down takes **30-60 seconds**.

- You'll see "Failed to fetch" or timeout
- **Wait 60 seconds** and try again
- Subsequent requests will be fast

## Alternative: Keep Backend Awake

If you want faster responses, you can:
1. Upgrade to Render paid tier ($7/month)
2. Use a service like UptimeRobot to ping your backend every 10 minutes

## Troubleshooting

### ❌ Still getting "Failed to fetch"?

**Check 1**: Is your Render backend running?
```bash
curl https://matic-backend.onrender.com/api/tables
```
Expected: Some response (even an error message)

**Check 2**: Check Render logs:
- Go to Render Dashboard → Your Service → Logs
- Look for errors

**Check 3**: Verify environment variables in Render:
- DATABASE_URL is set correctly
- SUPABASE_URL is set
- SUPABASE_ANON_KEY is set

### ❌ CORS Error in browser console?

Update `backend/app/main.py` CORS settings (see Step 4 above)

### ❌ 500 Internal Server Error?

Check Render logs for:
- Database connection issues
- Missing environment variables
- Code errors

---

**Quick Status Check**:
1. ✅ Frontend env updated to use Render backend
2. ⏳ Restart frontend dev server
3. ⏳ Test adding a column
4. ⏳ Verify it works!
