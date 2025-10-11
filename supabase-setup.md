# Supabase Database Setup Guide

## Your Supabase Project Info

- **Project URL**: `https://bpvdnphvunezonyrjwub.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Get Database Connection String

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **Database**
4. Scroll to **Connection string** section
5. Select **URI** tab
6. Copy the connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@db.bpvdnphvunezonyrjwub.supabase.co:5432/postgres`)
7. Replace `[YOUR-PASSWORD]` with your actual database password

### Option 2: Connection Pooler (For Production)
1. In the same Database settings page
2. Find **Connection pooler** section
3. Mode: **Transaction** (recommended for FastAPI)
4. Copy the connection string
5. Format: `postgresql://postgres.bpvdnphvunezonyrjwub:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## FastAPI Configuration

For FastAPI with SQLAlchemy async, use this format:

```
postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.bpvdnphvunezonyrjwub.supabase.co:5432/postgres
```

Or with connection pooler:

```
postgresql+asyncpg://postgres.bpvdnphvunezonyrjwub:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Apply Schema

### Via Supabase SQL Editor (Easiest)
1. Go to https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub/sql
2. Click **New query**
3. Copy and paste the contents of `001_initial_schema_supabase.sql`
4. Click **Run** or press `Cmd/Ctrl + Enter`
5. Wait for all statements to execute

### Via psql (If you have it installed)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.bpvdnphvunezonyrjwub.supabase.co:5432/postgres" < 001_initial_schema_supabase.sql
```

## Update Backend .env

Edit `backend/.env`:

```env
# Supabase Database Connection
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.bpvdnphvunezonyrjwub.supabase.co:5432/postgres

# Or use connection pooler for production:
# DATABASE_URL=postgresql+asyncpg://postgres.bpvdnphvunezonyrjwub:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase API (for auth verification - future use)
SUPABASE_URL=https://bpvdnphvunezonyrjwub.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdmRucGh2dW5lem9ueXJqd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNjYwNjEsImV4cCI6MjA3NTY0MjA2MX0.61XNqx0Lqm_P_p8mypVsyU2U4LdoOWxEa8BxgkGZp74

DEBUG=true
```

## Test Connection

```bash
cd backend
source ../.venv/bin/activate
python -c "
import asyncio
from app.db.session import get_engine

async def test():
    engine = get_engine()
    async with engine.connect() as conn:
        result = await conn.execute('SELECT version()')
        print('✅ Database connected!')
        print(result.scalar())

asyncio.run(test())
"
```

## Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

Then visit: http://localhost:8000/docs

## Next Steps

1. Get your database password from Supabase dashboard
2. Update the DATABASE_URL in `backend/.env`
3. Apply the schema via Supabase SQL Editor
4. Test the connection
5. Start the backend server
6. Test API endpoints via http://localhost:8000/docs
