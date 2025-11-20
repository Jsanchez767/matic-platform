# Hybrid Architecture Setup Guide

## Overview
The Activities Hub now uses a **hybrid architecture**:
- **Go Backend API** - All CRUD operations (create, read, update, delete)
- **Supabase Realtime** - Live updates and collaboration features

This gives you the benefits of both: centralized backend logic + instant UI updates.

## Architecture Flow

```
User Action (Add Participant)
  ↓
Go API Client (/api/v1/tables/:id/rows)
  ↓
Go Backend Handler
  ↓
PostgreSQL Database
  ↓
Supabase Realtime (postgres_changes event)
  ↓
Frontend Subscription Handler
  ↓
UI Auto-Updates
```

## Setup Instructions

### 1. Start the Go Backend

**Production**: The Go backend is already running at **https://backend.maticslab.com**

**Local Development** (optional):
```bash
cd go-backend

# Install dependencies (first time only)
go mod download

# Run the server
go run main.go
```

Local backend will start on **http://localhost:8080**

### 2. Start the Frontend

```bash
# In the project root
npm run dev
```

The Next.js app will start on **http://localhost:3000**

### 3. Configure Environment Variables

Make sure your `.env.local` has:

```env
# Supabase (for auth + realtime)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Go Backend API
NEXT_PUBLIC_GO_API_URL=https://backend.maticslab.com/api/v1
# Or for local development:
# NEXT_PUBLIC_GO_API_URL=http://localhost:8080/api/v1
```

### 4. Test the Hybrid Architecture

#### Test CRUD Operations (Go API)

1. **Navigate to Activities Hub** → **Enrolled** tab
2. **Add a Participant**:
   - Click "Add Participant"
   - Fill in student information
   - Select programs to enroll in
   - Click "Save"
   - ✅ Check browser console - should see `POST https://backend.maticslab.com/api/v1/tables/{id}/rows`
   - ✅ Response should show the created participant data

3. **Update a Participant**:
   - Click on a participant card
   - Edit any field
   - Click "Save"
   - ✅ Check console - should see `PATCH https://backend.maticslab.com/api/v1/tables/{id}/rows/{row_id}`

4. **Delete a Participant**:
   - Open participant detail panel
   - Click "Delete"
   - ✅ Check console - should see `DELETE https://backend.maticslab.com/api/v1/tables/{id}/rows/{row_id}`

#### Test Realtime Updates (Supabase)

1. **Open two browser windows** side-by-side with the same workspace
2. **In Window 1**: Add a new participant
3. **In Window 2**: ✅ The participant should automatically appear (no refresh needed!)
4. **In Window 1**: Unenroll a participant from a program
5. **In Window 2**: ✅ The enrollment change should reflect instantly

#### Check Console Logs

When realtime updates work, you should see:
```
Participants row change: {eventType: 'INSERT', new: {...}, old: null}
Enrollment link change: {eventType: 'DELETE', new: null, old: {...}}
```

## Implemented Features

### ✅ EnrolledView (Participants Management)
- ✅ Create participant → Go API
- ✅ Update participant → Go API
- ✅ Delete participant → Go API
- ✅ Enroll in activity → Go API (`/row-links`)
- ✅ Unenroll from activity → Go API (`/row-links/{id}`)
- ✅ Realtime row updates → Supabase subscription on `table_rows`
- ✅ Realtime enrollment updates → Supabase subscription on `table_row_links`

### 🚧 AttendanceView (Next to Migrate)
- Currently: Uses Supabase direct queries
- Next step: Migrate to Go API + add realtime for attendance records

## Go Backend Endpoints

All endpoints are under `/api/v1`:

### Tables & Rows
- `GET /tables?workspace_id={id}` - List all tables
- `POST /tables` - Create table
- `GET /tables/{id}/rows` - Get all rows (participants)
- `POST /tables/{id}/rows` - Create row (participant)
- `PATCH /tables/{id}/rows/{row_id}` - Update row
- `DELETE /tables/{id}/rows/{row_id}` - Delete row

### Table Links (Relationships)
- `GET /table-links?table_id={id}` - Get all links for a table
- `POST /table-links` - Create relationship between tables
- `DELETE /table-links/{id}` - Delete relationship

### Row Links (Enrollments)
- `GET /row-links/rows/{row_id}/linked?link_id={id}` - Get linked rows
- `POST /row-links` - Create enrollment (link two rows)
- `PATCH /row-links/{id}` - Update enrollment metadata
- `DELETE /row-links/{id}` - Delete enrollment

## Troubleshooting

### Go Backend Not Starting (Local Development)
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill the process if needed
kill -9 <PID>

# Start again
cd go-backend && go run main.go
```

### API Errors (Network)
**Production**:
- Backend should be accessible at https://backend.maticslab.com
- Check if backend is running by visiting https://backend.maticslab.com/health
- Verify CORS is configured for your frontend domain

**Local Development**:
- Make sure Go backend is running on http://localhost:8080
- Set `NEXT_PUBLIC_GO_API_URL=http://localhost:8080/api/v1` in `.env.local`
- Check browser console for CORS errors

### Realtime Not Working
- Check Supabase project settings → API → Realtime is enabled
- Verify RLS policies allow `SELECT` on `table_rows` and `table_row_links`
- Check browser console for subscription errors
- Refresh the page to re-establish subscriptions

### Database Connection Issues
Go backend needs database connection string in `go-backend/config/config.go`:
```go
DatabaseURL: os.Getenv("DATABASE_URL")
```

Set in environment:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/database?sslmode=require"
```

## Next Steps

1. **Migrate AttendanceView** to use Go API
2. **Add attendance records** table with links to participants
3. **Create realtime subscriptions** for attendance updates
4. **Test collaborative attendance** taking across multiple users

## Benefits Achieved

✅ **Centralized Logic** - All business rules in Go backend  
✅ **Type Safety** - Go's strong typing catches errors  
✅ **Better Performance** - Go handles complex queries efficiently  
✅ **Instant Updates** - Supabase realtime keeps UI in sync  
✅ **Collaboration** - Multiple users see changes immediately  
✅ **Easier Testing** - API endpoints can be tested independently  
✅ **Future-Proof** - Can add caching, rate limiting, validation easily  

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  Go API Client │         │ Supabase Realtime│       │
│  │  (Write Ops)   │         │  (Read Updates)  │       │
│  └────────┬───────┘         └────────┬─────────┘       │
└───────────┼──────────────────────────┼──────────────────┘
            │                          │
            │ HTTP POST/PATCH/DELETE   │ WebSocket
            │                          │ (postgres_changes)
            ↓                          ↓
┌─────────────────────┐      ┌──────────────────────┐
│   Go Backend API    │      │  Supabase Realtime   │
│   (localhost:8080)  │      │      Service         │
└─────────┬───────────┘      └──────────┬───────────┘
          │                             │
          │ SQL Queries                 │ LISTEN/NOTIFY
          ↓                             ↓
    ┌──────────────────────────────────────┐
    │     PostgreSQL Database              │
    │     (Supabase)                       │
    │                                      │
    │  - table_rows                        │
    │  - table_row_links                   │
    │  - table_links                       │
    └──────────────────────────────────────┘
```
