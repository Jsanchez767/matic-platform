# Render Deployment Failure - Troubleshooting Guide

## Common Causes & Solutions

### 1. Check Render Dashboard Logs
**Most Important:** Go to https://dashboard.render.com → Your service → Logs

Look for:
- Build errors
- Missing dependencies
- Python version issues
- Database connection errors
- Import errors

### 2. Python Version Mismatch
**Issue:** render.yaml specifies Python 3.11.0 but might not be available

**Fix:** Update render.yaml to use a stable version:
```yaml
envVars:
  - key: PYTHON_VERSION
    value: 3.11  # Remove the .0
```

Or remove it entirely to use Render's default.

### 3. Missing Environment Variables
**Issue:** DATABASE_URL not set in Render dashboard

**Fix:**
1. Go to Render Dashboard → Your service → Environment
2. Add `DATABASE_URL` with your Supabase connection string:
   ```
   postgresql+asyncpg://postgres.PROJECT_ID:PASSWORD@HOST:5432/postgres
   ```

### 4. Build Command Issues
**Issue:** Dependencies failing to install

**Try:**
```yaml
buildCommand: pip install --upgrade pip && pip install -r requirements.txt
```

### 5. Import Error with `re` Module
**Issue:** Our code added `import re` which is a built-in module

**Verification:** This should NOT cause issues as `re` is part of Python standard library.

If it does, check the import section:
```python
# backend/app/routers/data_tables.py
import re  # Should be at the top
from typing import List, Optional
from uuid import UUID
```

### 6. Pydantic Version Conflict
**Issue:** Project uses Pydantic v1.x style but might install v2.x

**Fix:** Pin the version in requirements.txt:
```
pydantic>=1.10.12,<2.0.0
```

### 7. Database Connection on Startup
**Issue:** Backend tries to connect to database on startup but connection fails

**Check:**
- Supabase database is running
- Connection string is correct
- Network allows connection from Render IPs

### 8. Port Binding Issue
**Issue:** Render uses dynamic PORT variable

**Verification:** Our startCommand uses `$PORT` correctly:
```yaml
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Quick Fixes to Try

### Fix 1: Update render.yaml
```yaml
services:
  - type: web
    name: matic-backend
    runtime: python
    region: oregon
    plan: free
    branch: main
    rootDir: backend
    buildCommand: pip install --upgrade pip && pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: DEBUG
        value: false
```

### Fix 2: Pin Pydantic Version
Update `backend/requirements.txt`:
```
fastapi>=0.111.0
uvicorn[standard]>=0.30.0
SQLAlchemy>=2.0.25
asyncpg>=0.29.0
pydantic>=1.10.12,<2.0.0  # Pin to v1.x
pydantic-settings>=2.0.0
python-dotenv>=1.0.1
alembic>=1.13.1
pytest>=8.3.2
httpx>=0.27.0
greenlet>=3.0.0
```

### Fix 3: Add Health Check Endpoint
Add to `backend/app/main.py`:
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

Then test with: `curl https://matic-backend.onrender.com/health`

## Debugging Steps

1. **Check Render Logs:**
   - Build logs: Did dependencies install?
   - Deploy logs: Did service start?
   - Runtime logs: Any errors after startup?

2. **Test Locally:**
   ```bash
   cd backend
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   If local works, it's a Render config issue.

3. **Check Recent Changes:**
   - We added `import re` (built-in, should work)
   - We added `generate_slug()` function (pure Python)
   - We added `slug` field to schema (Optional, should work)
   - No new dependencies added

4. **Verify Database Access:**
   - Can Render reach your Supabase instance?
   - Is IP whitelisting enabled in Supabase?

## Most Likely Issues

Based on our changes, the most likely causes:

### 1. **DATABASE_URL Not Set** (Most Common)
Go to Render Dashboard and ensure DATABASE_URL is configured.

### 2. **Pydantic Version Conflict**
Render might install Pydantic 2.x which breaks our code.
**Solution:** Pin to `pydantic>=1.10.12,<2.0.0`

### 3. **Python Version Issue**
Remove `.0` from PYTHON_VERSION or use default.

## What to Share for More Help

If still failing, please share:

1. **Render build logs** (copy/paste the error)
2. **Render deploy logs** (copy/paste)
3. **Environment variables** (names only, not values)
4. **Error message** (exact text)

Example log sections to share:
```
==> Building...
[error message here]

==> Deploying...
[error message here]
```

## Rollback Option

If you need the backend working immediately:

```bash
# Revert the changes
git revert HEAD
git push origin main
```

This will undo the last commit and Render will redeploy the previous version.

## Test Changes Locally First

Before pushing to trigger deployment:

```bash
cd backend
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000

# Test in another terminal
curl http://localhost:8000/api/tables?workspace_id=test
```

If local works, the code is fine. Issue is Render config.

## Contact Support

If nothing works:
- Render Support: https://render.com/support
- Check Render Status: https://status.render.com/
- Community: https://community.render.com/
