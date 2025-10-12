# Link Field "Failed to Fetch" Error - Troubleshooting

## Error Seen
```
Error saving column: TypeError: Failed to fetch
```

## Root Cause
This error occurs when the browser cannot connect to the backend API. Most commonly with Render free tier.

## Possible Causes & Solutions

### 1. Render Backend Is Sleeping (Most Likely)
**Problem:** Render free tier spins down after 15 minutes of inactivity. Takes 30-60 seconds to wake up.

**Solution:**
1. Open https://matic-backend.onrender.com/docs in a new tab
2. Wait 30-60 seconds for it to load
3. Once you see the Swagger docs, try creating the column again
4. The backend is now "warm" and should respond

**Prevention:** Keep a tab open with the docs page, or upgrade to Render paid tier.

### 2. CORS Issue
**Problem:** Browser blocking cross-origin requests.

**Check:** Open browser console (F12) and look for CORS errors like:
```
Access to fetch at 'https://matic-backend.onrender.com' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:** Add your domain to backend CORS:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Already there
        # Add if needed:
        # "http://127.0.0.1:3000",
    ],
)
```

### 3. Invalid UUID Format
**Problem:** `linked_table_id` sent as string, backend expects UUID.

**Check:** Console should show validation error with 422 status.

**Solution:** Already handled - frontend sends correct UUID string, backend converts.

### 4. Network/Timeout
**Problem:** Request timing out due to slow connection.

**Solution:** 
- Check internet connection
- Try again after a few seconds
- Check Render dashboard for backend status

## Quick Test

Run this in browser console while on your app:
```javascript
fetch('https://matic-backend.onrender.com/api/tables?workspace_id=YOUR_WORKSPACE_ID')
  .then(r => r.json())
  .then(data => console.log('Backend is working!', data))
  .catch(err => console.error('Backend error:', err))
```

Replace `YOUR_WORKSPACE_ID` with your actual workspace ID.

## Improved Error Message

I've updated the error handling to show:
```
Network error: Cannot reach backend at https://matic-backend.onrender.com/api

Possible causes:
- Backend is sleeping (Render free tier) - wait 30-60s and try again  
- Backend is down
- CORS issue

Check browser console for details.
```

## Debug Checklist

When you get this error:

1. [ ] Open browser console (F12) → Network tab
2. [ ] Try to create link column again
3. [ ] Look for the POST request to `/api/tables/{id}/columns`
4. [ ] Check the status code:
   - **0 / (failed)**: Network issue or CORS
   - **404**: Wrong URL or backend route missing
   - **422**: Validation error (check payload)
   - **500**: Backend error (check Render logs)
5. [ ] Click on the failed request → see exact error
6. [ ] Share the error details for more specific help

## Logs to Check

### Browser Console
```
POST https://matic-backend.onrender.com/api/tables/{uuid}/columns
Status: (failed) net::ERR_CONNECTION_TIMED_OUT
```

### Render Logs
Go to: https://dashboard.render.com → Your service → Logs
Look for:
- Service starting up
- Incoming requests
- Python errors

## Working Backend Test

To verify backend is functional:
```bash
# Terminal test
curl -X GET "https://matic-backend.onrender.com/api/tables?workspace_id=test" \
  -H "Content-Type: application/json"

# Should return JSON (even if error, shows backend is responding)
```

## Next Steps

1. **Immediate**: Wake up Render backend by visiting /docs
2. **Short-term**: Try creating link column again after 60 seconds
3. **Long-term**: Consider Render paid tier or keep-alive service

## Alternative: Local Backend

If Render keeps sleeping, run backend locally:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Still Not Working?

Share these details:
1. Browser console screenshot (Network tab)
2. Exact error message
3. Backend URL you're using
4. Render dashboard status
5. Whether /docs page loads
