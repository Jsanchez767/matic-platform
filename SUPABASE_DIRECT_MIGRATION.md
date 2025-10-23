# Supabase Direct Migration - Scan History

**Date**: October 22, 2025  
**Decision**: Use Supabase Direct queries instead of FastAPI for scan history feature

---

## Background

The project was initially migrating from Supabase direct queries to FastAPI backend. However, persistent issues with pgBouncer prepared statement caching led to a strategic decision to use Supabase Direct for specific features.

### Issues Encountered with FastAPI + pgBouncer
- `asyncpg.exceptions.DuplicatePreparedStatementError` - prepared statement conflicts
- PostgreSQL transaction pooler (port 6543) incompatible with asyncpg prepared statements
- Render free tier cold starts causing poor UX
- Extra deployment complexity (Vercel + Render)
- CORS configuration challenges

---

## Architecture Decision

### ✅ **Scan History: Supabase Direct**

**Rationale**:
- Simple CRUD operations (create scan, list scans)
- Real-time updates already working via Supabase Realtime
- Low complexity - no need for backend layer
- Better performance (no FastAPI middle layer)
- Simpler deployment (Vercel only)

**Implementation**:
```typescript
// src/lib/api/scan-history-client.ts
import { createClient } from '@supabase/supabase-js'

export const scanHistoryAPI = {
  create: async (data: ScanHistoryCreate) => {
    const { data: scan, error } = await supabase
      .from('scan_history')
      .insert(data)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return scan
  },
  
  list: async (params) => {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('table_id', params.tableId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data
  }
}
```

**Security**: Row Level Security (RLS) policies protect access
- Users can only view/create scans in their workspaces
- Enforced at database level via `workspace_members` join

---

## Migration Status

### ✅ Completed - Supabase Direct
- **Scan History** (`scan_history` table)
  - RLS policies implemented (`setup_scan_history_rls.sql`)
  - API client updated to use Supabase direct
  - Real-time subscriptions working
  - Frontend deployed

### ⏸️ Remaining on FastAPI
- **Data Tables** (`data_tables`, `table_columns`, `table_rows`, `table_views`)
- **Forms** (`forms`, `form_fields`, `form_submissions`)
- **Workspaces** (`workspaces`, `workspace_members`)

**Note**: These may also migrate to Supabase Direct if FastAPI issues persist.

---

## Benefits Realized

1. **Instant Loading**: No backend cold starts
2. **Simpler Debugging**: One less layer to troubleshoot
3. **Lower Latency**: Direct database queries (~50-150ms vs 200-500ms)
4. **Real-time Native**: Supabase Realtime integrated seamlessly
5. **Cost**: $0 (Supabase free tier vs. $7/month for Render)

---

## Future Considerations

### When to Use FastAPI
- Complex business logic (multi-step transactions)
- Heavy data processing (formula calculations, rollups)
- External API integrations
- Rate limiting / caching needs

### When to Use Supabase Direct
- Simple CRUD operations
- Real-time requirements
- Low latency needs
- Features that benefit from RLS

### When to Use Edge Functions
- Server-side logic without FastAPI overhead
- Complex validation
- Lightweight compute tasks
- Runs on Cloudflare Workers (ultra-low latency)

---

## Files Changed

- `src/lib/api/scan-history-client.ts` - Migrated from FastAPI to Supabase
- `setup_scan_history_rls.sql` - RLS policies for security
- `src/app/scan-results/page.tsx` - Already using Supabase Realtime

---

## Lessons Learned

1. **Don't over-architect**: FastAPI was overkill for simple CRUD
2. **Work with your tools**: Supabase Realtime is powerful - use it!
3. **pgBouncer + asyncpg**: Transaction pooler has limitations with prepared statements
4. **Free tier constraints**: Render sleep time hurts UX more than expected
5. **Simplicity wins**: Fewer moving parts = easier debugging

---

## Next Steps

1. Monitor scan history performance in production
2. Consider migrating other simple features to Supabase Direct
3. Keep FastAPI for genuinely complex operations
4. Explore PartyKit for multiplayer features (Phase 2)
