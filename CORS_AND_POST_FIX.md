# CORS and POST Endpoint Fix

## Problem
The "Failed to fetch" error was caused by two issues:

1. **Missing POST endpoint**: The `/api/workspaces` router only had GET endpoints, no POST endpoint for creating workspaces.

2. **Missing CORS middleware**: The backend was not configured to accept requests from the frontend (localhost:3000), causing CORS preflight failures.

3. **Missing organization handling**: Workspaces require an `organization_id`, but we weren't creating organizations.

## Solution

### 1. Added WorkspaceCreate Schema
**File**: `backend/app/schemas/workspaces.py`

```python
class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    owner_id: UUID
```

### 2. Added POST Endpoint
**File**: `backend/app/routers/workspaces.py`

Created a new `create_workspace` endpoint that:
- Checks if user has an organization, creates one if not
- Creates the workspace with the organization_id
- Adds the user as a workspace member with admin role
- Returns the created workspace

### 3. Added CORS Middleware
**File**: `backend/app/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing

The backend has auto-reloaded with these changes. Try the signup flow again:

1. Go to http://localhost:3000/signup
2. Fill in:
   - Email: your email
   - Password: your password
   - Confirm Password: same password
   - Workspace Name: your workspace name
3. Click "Sign Up"

You should now:
- See the workspace being created (no more "Failed to fetch")
- Be redirected to `/workspace/{slug}`
- Have a user in Supabase auth.users
- Have an organization in the organizations table
- Have a workspace in the workspaces table
- Have a workspace_member record

## What Was Fixed

**Before**:
```
Frontend POST → /api/workspaces
    ↓
Next.js proxy → http://localhost:8000/api/workspaces
    ↓
Backend → 307 Redirect to /api/workspaces/
    ↓
Browser → Send OPTIONS preflight
    ↓
Backend → 405 Method Not Allowed (no POST endpoint + no CORS)
    ↓
Frontend → "Failed to fetch"
```

**After**:
```
Frontend POST → /api/workspaces
    ↓
Next.js proxy → http://localhost:8000/api/workspaces
    ↓
Backend CORS → Accept preflight OPTIONS
    ↓
Backend POST endpoint → Create org + workspace + member
    ↓
Backend → Return 201 with workspace data
    ↓
Frontend → Redirect to workspace ✅
```

## Status
✅ Backend reloaded and running
✅ CORS configured
✅ POST endpoint added
✅ Organization auto-creation implemented
✅ Ready for testing
