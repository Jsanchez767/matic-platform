# 🔧 Quick Fix: Backend Database Connection

## The Issue
Your backend can't connect to the database because it's using default credentials from `.env.example`.

## Quick Fix (2 minutes)

### Step 1: Get Your Supabase Connection String

1. Go to: **https://supabase.com/dashboard**
2. Select your project
3. Click **Project Settings** (gear icon) → **Database**
4. Scroll to "Connection string" section
5. Click **"Connection pooling"** tab (not "Direct connection")
6. Copy the connection string (it looks like this):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
7. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

### Step 2: Create `.env` File

1. Open terminal and run:
   ```bash
   cd /Users/jesussanchez/Downloads/matic-platform/backend
   nano .env
   ```

2. Paste this content (replace with YOUR values):
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   DEBUG=false
   SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
   SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   ```

3. Save and exit (Ctrl+X, then Y, then Enter)

### Step 3: Format the DATABASE_URL

**Critical**: Change `postgresql://` to `postgresql+asyncpg://` at the start!

Before:
```
postgresql://postgres.[PROJECT]...
```

After:
```
postgresql+asyncpg://postgres.[PROJECT]...
```

### Step 4: Start Backend

```bash
cd /Users/jesussanchez/Downloads/matic-platform/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 5: Test It

Open a new terminal and run:
```bash
curl http://localhost:8000/api/tables
```

Should return something like `{"detail":"Method Not Allowed"}` (not 404 or connection error)

## Alternative: Use VS Code

1. Open `/Users/jesussanchez/Downloads/matic-platform/backend/.env` in VS Code
2. Copy content from `.env.example`
3. Replace with your Supabase credentials
4. Save

## Where to Find Supabase Credentials

**Database Password**:
- If you forgot it, reset it in: Project Settings → Database → "Database password" section

**Supabase URL**:
- Project Settings → API → "Project URL"
- Format: `https://abc123xyz.supabase.co`

**Anon Key**:
- Project Settings → API → "Project API keys" → "anon public"
- Long JWT token starting with `eyJ...`

## After Backend Starts Successfully

1. **Refresh your browser** at maticsapp.com
2. **Try adding a column** again
3. Should work without "Failed to fetch" error

---

**Need help?** The error message will tell you if:
- ❌ Password is wrong: "password authentication failed"
- ❌ Connection string format: "could not translate host name"
- ✅ Connected: "Application startup complete"
