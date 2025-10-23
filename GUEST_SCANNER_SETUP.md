# Guest Scanner Setup Guide

## Overview
This enables **anyone with a QR code** to use the mobile scanner without creating an account. They just enter their name and email, which is stored in the scan metadata for tracking.

## Quick Setup (5 minutes)

### Step 1: Create System User in Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `docs/enable_guest_scanner_SIMPLE.sql`
5. Click **Run** (or press Cmd+Enter)

You should see output like:
```
Success: No rows returned
```

And then verification results showing:
```
id                                   | email                        | created_at
00000000-0000-0000-0000-000000000001 | scanner-guest@system.local   | 2025-10-23...
```

### Step 2: Verify RLS Policies

The SQL script also creates RLS policies for the `anon` role. You should see policies like:
- ✅ Guest scanner can view tables
- ✅ Guest scanner can view columns
- ✅ Guest scanner can view rows
- ✅ Guest scanner can update rows
- ✅ Guest scanner can create scan history

### Step 3: Test Guest Scanning

1. **On Desktop**: Generate a scanner QR code (pairing code page)
2. **On Mobile**: 
   - Scan the QR code (or visit the URL directly)
   - Scanner should open WITHOUT requiring login
   - You'll see "Guest Scanner Access" dialog
   - Enter name (required) and email (optional)
   - Click "Continue"
   - Start scanning!

## How It Works

### Guest User Flow

```
1. User scans QR code → Opens scanner page
2. No authentication check → Loads immediately
3. Prompts for name/email → Saves to localStorage
4. Scans barcode → Uses system user ID (00000000-0000-0000-0000-000000000001)
5. Updates row → created_by/updated_by = system user ID
6. Saves scan history → metadata contains {scannedBy: "Name", scannedByEmail: "email", isGuest: true}
```

### Data Storage

**Guest Info (localStorage)**:
- Key: `scanner_user_name` → Value: "John Doe"
- Key: `scanner_user_email` → Value: "john@example.com"
- Persists across scans on same device
- Can be cleared by user

**Scan Metadata (database)**:
```json
{
  "scannedBy": "John Doe",
  "scannedByEmail": "john@example.com",
  "isGuest": true,
  "deviceType": "mobile",
  "pairingCode": "ABC123"
}
```

**Row Updates**:
- `created_by`: `00000000-0000-0000-0000-000000000001` (system user)
- `updated_by`: `00000000-0000-0000-0000-000000000001` (system user)
- Satisfies foreign key constraints
- Works with RLS policies

## Security Considerations

### Current Setup (Open Access)

⚠️ **Warning**: The current RLS policies allow **full anonymous access** to:
- ✅ Read all tables, columns, and rows
- ✅ Update any row (for scan count)
- ✅ Create scan history records

This is intentional for maximum convenience but has security implications.

### Recommended Improvements

1. **Workspace-Level Restrictions**
   ```sql
   -- Only allow guest scanning in workspaces that explicitly enable it
   CREATE POLICY "Guest scanner can view rows in allowed workspaces"
   ON table_rows FOR SELECT
   TO anon
   USING (
     table_id IN (
       SELECT id FROM data_tables 
       WHERE workspace_id IN (
         SELECT id FROM workspaces WHERE allow_guest_scanning = true
       )
     )
   );
   ```

2. **Rate Limiting**
   - Add Supabase Edge Function with rate limiting
   - Use IP-based throttling
   - Implement CAPTCHA for suspicious patterns

3. **Pairing Code Expiration**
   ```typescript
   // Check pairing code age
   if (pairingCodeAge > 24 * 60 * 60 * 1000) {
     throw new Error('Pairing code expired')
   }
   ```

4. **Audit Trail Monitoring**
   ```sql
   -- Query for suspicious guest activity
   SELECT 
     metadata->>'scannedBy' as scanner_name,
     COUNT(*) as scan_count,
     COUNT(DISTINCT barcode) as unique_barcodes
   FROM scan_history
   WHERE metadata->>'isGuest' = 'true'
   AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY metadata->>'scannedBy'
   HAVING COUNT(*) > 100;
   ```

## Troubleshooting

### Issue: "Foreign key constraint violation"

**Cause**: System user not created in database

**Solution**:
1. Run `docs/enable_guest_scanner_SIMPLE.sql` in Supabase SQL Editor
2. Verify system user exists:
   ```sql
   SELECT id, email FROM auth.users 
   WHERE id = '00000000-0000-0000-0000-000000000001';
   ```

### Issue: "RLS policy violation" or "permission denied"

**Cause**: Anonymous RLS policies not created

**Solution**:
1. Run the RLS policy section of `enable_guest_scanner_SIMPLE.sql`
2. Verify policies exist:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE 'anon' = ANY(roles);
   ```

### Issue: Scanner still requires login

**Cause**: Old code cached in browser

**Solution**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Or clear browser cache
3. Or open in incognito/private mode

### Issue: Name/email not showing in scan history

**Cause**: Metadata not being saved correctly

**Solution**:
1. Check browser console for errors
2. Verify localStorage has values:
   ```javascript
   localStorage.getItem('scanner_user_name')
   localStorage.getItem('scanner_user_email')
   ```
3. Check scan_history.metadata field in database

## Testing Checklist

- [ ] Scanner opens without login required
- [ ] "Guest Scanner Access" dialog appears
- [ ] Can enter name and proceed
- [ ] Guest info saved to localStorage
- [ ] Barcode scan works and finds matches
- [ ] Row scan_count increments
- [ ] Scan history record created
- [ ] Metadata contains scannedBy and isGuest:true
- [ ] created_by = 00000000-0000-0000-0000-000000000001
- [ ] Can scan multiple barcodes in sequence
- [ ] Info persists after closing/reopening scanner

## Migration Path

If you later want to restrict guest access:

1. **Add workspace flag**:
   ```sql
   ALTER TABLE workspaces ADD COLUMN allow_guest_scanning BOOLEAN DEFAULT false;
   ```

2. **Update RLS policies** to check this flag

3. **Create admin UI** to enable/disable guest scanning per workspace

4. **Migrate existing users** to require authentication for certain workspaces

## Files Reference

- **Frontend**:
  - `src/lib/guest-scanner.ts` - Guest client and helpers
  - `src/app/scan/page.tsx` - Scanner page (no auth required)
  
- **Database**:
  - `docs/enable_guest_scanner_SIMPLE.sql` - Setup script
  - `docs/create_guest_scanner_user.sql` - Alternative approach

- **Documentation**:
  - `SCANNER_AUTH_FIX.md` - Previous auth requirement (now deprecated)
  - `GUEST_SCANNER_SETUP.md` - This file

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify RLS policies in SQL editor
4. Test with incognito mode
5. Check scan_history table for records
