# Mobile Scanner Authentication Fix

## Problem Summary

Mobile barcode scanner was failing to update rows with the error:
```
Failed to update row: insert or update on table "table_rows" violates foreign key constraint "table_rows_updated_by_fkey"
```

## Root Cause

The scanner page allowed **unauthenticated access**, but the database requires:

1. **Foreign Key Constraints**: Both `created_by` and `updated_by` fields in `table_rows` must reference valid user IDs from `auth.users(id)`
2. **Row Level Security (RLS)**: Policies block read/write operations without authenticated user context
3. **Scanner Logic**: Was passing `workspace_id` instead of `user_id` to the `updated_by` field

## Database Schema (from 001_initial_schema.sql)

```sql
CREATE TABLE table_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    position REAL,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),  -- REQUIRED user ID
    updated_by UUID REFERENCES auth.users(id),           -- MUST be valid user ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Evidence from Scan History

Looking at the CSV export of `scan_history`:

| created_at | created_by | status | notes |
|------------|------------|--------|-------|
| 2025-10-23 02:02:18 | *empty* | success | ❌ No auth - worked before RLS |
| 2025-10-23 02:02:22 | *empty* | success | ❌ No auth - worked before RLS |
| 2025-10-23 02:02:28 | *empty* | success | ❌ No auth - worked before RLS |
| 2025-10-23 06:09:15 | `95e273c6-...` | success | ✅ Desktop scan with auth |

The latest entry (from desktop) has a valid `created_by` user ID and worked correctly.

## Solutions Implemented

### 1. Authentication Guard (src/app/scan/page.tsx)

Added authentication check on scanner page mount:

```typescript
const [isCheckingAuth, setIsCheckingAuth] = useState(true)

useEffect(() => {
  const checkAuth = async () => {
    const { getCurrentUser } = await import('@/lib/supabase')
    const user = await getCurrentUser()
    
    if (!user) {
      console.warn('⚠️ No authenticated user - redirecting to login')
      toast.error('Please sign in to use the scanner')
      router.push('/login?redirect=/scan' + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      return
    }
    
    console.log('✅ User authenticated:', user.id)
    setIsCheckingAuth(false)
  }
  
  checkAuth()
}, [router, searchParams])
```

**Benefits:**
- Blocks unauthenticated access immediately
- Preserves pairing code and table params in redirect
- Shows user-friendly loading screen during check

### 2. Fixed Row Update Logic

Changed from workspace ID to user ID:

**Before:**
```typescript
await rowsSupabase.update(tableId, row.id, { 
  data: updatedData,
  updated_by: workspaceId || 'system' // ❌ Wrong - workspace UUID
})
```

**After:**
```typescript
// Get current user first (needed for both row update and scan history)
const { getCurrentUser } = await import('@/lib/supabase')
const user = await getCurrentUser()

// ... later in row update ...
await rowsSupabase.update(tableId, row.id, { 
  data: updatedData,
  updated_by: user.id // ✅ Correct - user UUID from auth.users
})
```

### 3. Loading State During Auth Check

Added visual feedback while verifying authentication:

```typescript
if (isCheckingAuth) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Shield className="w-12 h-12 text-blue-500 animate-pulse" />
          <h2 className="text-xl font-semibold">Checking Authentication...</h2>
          <p className="text-sm text-gray-600">
            Verifying your access to the scanner
          </p>
        </div>
      </Card>
    </div>
  )
}
```

## Testing Instructions

### Mobile Scanner (Primary Use Case)

1. **Without Login** (should be blocked):
   - Open scanner URL on mobile: `https://your-app.com/scan?table=xxx&column=yyy&code=ABC123`
   - Should see "Checking Authentication..." screen
   - Should redirect to login with message: "Please sign in to use the scanner"
   - Login page should preserve redirect params

2. **After Login** (should work):
   - Sign in on mobile device
   - Navigate to scanner (or use pairing code link)
   - Scanner should initialize successfully
   - Scan a barcode
   - Should see: `✅ Updated row [id] scan count to [number]`
   - Should NOT see foreign key constraint errors
   - Scan history should have `created_by` field populated

### Verify in Database

Query `scan_history` after successful scan:

```sql
SELECT 
  barcode,
  status,
  created_by,
  created_at,
  metadata->>'scannedBy' as scanned_by_name
FROM scan_history
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- `created_by` should be a valid UUID (not null)
- `status` should be 'success'
- No foreign key constraint errors in logs

## Related Files Modified

1. **src/app/scan/page.tsx**
   - Added auth check on mount
   - Added loading state during auth check
   - Fixed `updated_by` to use `user.id` instead of `workspace_id`
   - Moved `getCurrentUser()` call before row updates

## Why This Matters

- **Security**: Ensures only authenticated users can scan and modify data
- **Data Integrity**: All audit fields (`created_by`, `updated_by`) now reference valid users
- **RLS Compliance**: Supabase Row Level Security policies work correctly with auth context
- **Better UX**: Clear error messages guide users to sign in before scanning

## Future Improvements

Consider:
- Add session persistence across page reloads on mobile
- Show user profile info in scanner header
- Add "Remember me" option for mobile scanner sessions
- Implement token refresh for long scanning sessions
