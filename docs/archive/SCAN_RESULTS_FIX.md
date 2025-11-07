# Fix: Scan Results Page Not Updating

## Problem
Mobile guest scans were saving successfully to the database, but the scan results page wasn't showing them in real-time.

## Root Cause
The scan results page requires **SELECT** permission on `scan_history` table, but the guest scanner RLS policies only included **INSERT** permission.

## Solution Applied

Added SELECT policy for anonymous users on `scan_history`:

```sql
-- Allow anonymous users to view scan history (needed for scan results page)
DROP POLICY IF EXISTS "Guest scanner can view scan history" ON scan_history;
CREATE POLICY "Guest scanner can view scan history"
ON scan_history FOR SELECT
TO anon
USING (true);

-- Grant SELECT permission
GRANT SELECT, INSERT ON scan_history TO anon;
```

## How to Apply

**Option 1: Run the complete script again** (recommended):
```bash
# In Supabase SQL Editor, run:
docs/enable_guest_scanner_SIMPLE.sql
```

**Option 2: Run just the new policy**:
```sql
-- Add SELECT policy for scan_history
DROP POLICY IF EXISTS "Guest scanner can view scan history" ON scan_history;
CREATE POLICY "Guest scanner can view scan history"
ON scan_history FOR SELECT
TO anon
USING (true);

GRANT SELECT ON scan_history TO anon;
```

## Verification

After running the SQL:

1. **Check Policy Exists**:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'scan_history' 
   AND 'anon' = ANY(roles);
   ```
   
   Should return:
   - `Guest scanner can create scan history` (INSERT)
   - `Guest scanner can view scan history` (SELECT)

2. **Test Scan Results Page**:
   - Open scan results page in browser
   - Should load existing scans (no authentication required)
   - Real-time updates should work when new scans arrive

3. **Test Mobile Scanner**:
   - Scan a barcode on mobile
   - Watch scan results page update in real-time
   - New scan should appear at the top immediately

## What This Enables

- ✅ Guest users can **create** scans (already working)
- ✅ Guest users can **view** scan history (newly added)
- ✅ Scan results page loads without authentication
- ✅ Real-time subscription works for anonymous users
- ✅ Desktop can monitor mobile scanning in real-time

## Technical Details

### RLS Policies for scan_history (anon role)

| Operation | Policy | Purpose |
|-----------|--------|---------|
| INSERT | Guest scanner can create scan history | Allow mobile scanner to save scans |
| SELECT | Guest scanner can view scan history | Allow results page to load and display |

### Real-Time Subscription

The scan results page subscribes to postgres_changes on `scan_history`:

```typescript
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'scan_history',
    filter: `table_id=eq.${tableId}`
  },
  (payload) => {
    // Add new scan to UI in real-time
  }
)
```

This works because:
1. `scan_history` is in the `supabase_realtime` publication
2. Anonymous users have SELECT permission (can subscribe)
3. New INSERTs trigger the subscription callback
4. UI updates immediately with new scan

## Common Issues

### Issue: "permission denied for table scan_history"

**Cause**: SELECT policy not created or GRANT not applied

**Fix**: Run the SQL policy creation script above

### Issue: Real-time not working

**Check**:
1. Is `scan_history` in realtime publication?
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'scan_history';
   ```

2. Is real-time enabled in Supabase dashboard?
   - Go to Database → Replication
   - Check if `scan_history` is in list

3. Check browser console for subscription errors

### Issue: Old scans not showing

**Cause**: May need to refresh the page or clear cache

**Fix**: 
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or click the "Refresh" button on scan results page

## Files Modified

- `docs/enable_guest_scanner_SIMPLE.sql` - Added SELECT policy and GRANT
- Commit: `25e7c92` - "Add SELECT permission for scan_history..."

## Next Steps

After applying this fix:
1. Test mobile scanning → results page update flow
2. Verify both guest and authenticated users can view results
3. Monitor for any real-time subscription issues
4. Consider adding more granular RLS policies if needed (e.g., by workspace)
