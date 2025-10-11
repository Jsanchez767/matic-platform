# Supabase Query Catalog - Migration Guide

## Overview
This document catalogs all Supabase client usage in the old app files and provides migration strategies for each.

---

## Summary Statistics
- **Files with Supabase usage**: 6 files
- **Total Supabase queries**: ~25+ queries
- **Authentication calls**: 8 calls to `supabase.auth.getUser()`
- **Table queries**: 16 direct table queries
- **Tables accessed**: forms, form_structure, workspaces, workspace_content, yjs_documents

---

## Migration Strategy

### ✅ Keep as-is (Supabase Auth)
- `supabase.auth.getUser()` - Keep for authentication
- `supabase.auth.signOut()` - Keep for logout

### 🔄 Migrate to FastAPI
- All `.from('table_name')` queries → REST API calls
- Direct database queries → API client functions

---

## File-by-File Catalog

### 1. ✅ FormBuilder.tsx
**Location**: `old-app-files/form-builder/components/builder/FormBuilder.tsx`  
**Priority**: HIGH (Core functionality)  
**Lines of Code**: 468

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 55 | `const supabase = createClient()` | Keep for auth |
| 102 | `.from('forms').select('*, form_structure(structure, yjs_document_id)')` | `GET /api/forms/{id}` |
| 178 | `supabase.auth.getUser()` | Keep |
| 237 | `.from('forms').update({title, description, updated_at})` | `PUT /api/forms/{id}` |
| 252 | `.from('form_structure').upsert({form_id, structure})` | Include in `PUT /api/forms/{id}` |
| 286 | `.from('form_structure').select('id, yjs_document_id')` | Remove (not in new schema) |
| 313 | `.from('form_structure').upsert({form_id, structure, yjs_document_id})` | Remove (not in new schema) |
| 341 | `.from('forms').update({status: 'published', published_at})` | `PUT /api/forms/{id}` |

#### Migration Notes:
- **form_structure table** doesn't exist in new schema - structure is stored as `form_fields` array
- **yjs_documents** - YJS collaboration needs separate handling (out of scope for now)
- Load form with fields: Use `GET /api/forms/{id}` which returns fields array
- Save form: Use `PUT /api/forms/{id}` with fields in request body

---

### 2. ⏸️ YjsFormBuilder.tsx
**Location**: `old-app-files/form-builder/components/builder/YjsFormBuilder.tsx`  
**Priority**: MEDIUM (Alternative builder, YJS-focused)  
**Lines of Code**: 681

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 108 | `const supabase = createClient()` | Keep for auth |
| 109 | `supabase.auth.getUser()` | Keep |
| 156 | `.from('form_structure').select('yjs_document_id')` | Remove (YJS out of scope) |
| 164 | `.from('form_structure').insert({form_id, yjs_document_id})` | Remove |
| 182 | `.from('yjs_documents').select('id')` | Remove |
| 193 | `.from('yjs_documents').insert({document_name, document_state})` | Remove |
| 214 | `.from('forms').select('*')` | `GET /api/forms/{id}` |
| 467 | `createClient()` again | Keep for auth |
| 468 | `supabase.auth.getUser()` | Keep |
| 495 | `.from('forms').update({title, description})` | `PUT /api/forms/{id}` |
| 513 | `.from('form_structure').upsert({form_id, structure})` | Include in PUT request |

#### Migration Notes:
- **YJS collaboration** is a separate concern - defer for now
- Can reuse same migration patterns as FormBuilder.tsx
- Consider deprecating this file if YJS not needed immediately

---

### 3. ✅ layout-wrapper.tsx
**Location**: `old-app-files/components/layout-wrapper.tsx`  
**Priority**: HIGH (Core layout component)  
**Lines of Code**: 100

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 28 | `const supabase = createClient()` | Keep for auth |
| 43 | `supabase.auth.getUser()` | Keep |
| 59 | `.from('workspaces').select('*').eq('slug', slug).single()` | `GET /api/workspaces/{workspace_id}` or new endpoint with slug |

#### Migration Notes:
- Need to add endpoint: `GET /api/workspaces/by-slug/{slug}` 
- Or change to use workspace ID instead of slug
- Auth check should remain with Supabase

---

### 4. ✅ NavigationLayout.tsx
**Location**: `old-app-files/components/NavigationLayout.tsx`  
**Priority**: HIGH (Main navigation)  
**Lines of Code**: 350

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 32 | `const supabase = createClient()` | Keep for auth |
| 66 | `supabase.auth.signOut()` | Keep |

#### Migration Notes:
- Uses `useWorkspaceDiscovery` hook which has Supabase queries
- Direct Supabase usage is only for auth - EASY migration

---

### 5. ✅ useWorkspaceDiscovery.ts
**Location**: `old-app-files/hooks/useWorkspaceDiscovery.ts`  
**Priority**: HIGH (Core hook for workspace data)  
**Lines of Code**: 150

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 19 | `const supabase = createClient()` | Keep for auth |
| 24 | `supabase.auth.getUser()` | Keep |
| 39 | `fetch('/api/workspaces/discover', {method: 'POST'})` | Already using API! Update endpoint |
| 79 | `.from('workspaces').select('id, name, slug, plan_type')` | `GET /api/workspaces?user_id={userId}` |

#### Migration Notes:
- **Good news**: Already partially migrated to use `/api/workspaces/discover`
- Just need to ensure backend endpoint exists (currently NOT in backend)
- Fallback query can use existing `GET /api/workspaces?user_id={userId}`

---

### 6. ⏸️ hybrid-search-engine.ts
**Location**: `old-app-files/lib/search/hybrid-search-engine.ts`  
**Priority**: MEDIUM (Search functionality)  
**Lines of Code**: 406

#### Supabase Usage:
| Line | Query | Migration Target |
|------|-------|------------------|
| 73 | `const supabase = createClient()` | Keep for auth |
| 76 | `.from('workspace_content').select('id, title, description, content_type, created_at, updated_at, yjs_document_id, yjs_documents(document_name)')` | NEW endpoint: `GET /api/workspaces/{id}/content` |

#### Migration Notes:
- **workspace_content** table doesn't exist in new schema
- Need to design aggregation strategy: workspace_content = forms + data_tables + ?
- May need full-text search implementation in backend
- **Deferred**: Low priority until core features work

---

## Missing Backend Endpoints

Based on the catalog, we need to add these endpoints:

### High Priority
1. ✅ `GET /api/forms/{id}` - Already exists
2. ✅ `PUT /api/forms/{id}` - Already exists  
3. ✅ `GET /api/workspaces?user_id={id}` - Already exists
4. ❌ `GET /api/workspaces/by-slug/{slug}` - NEED TO ADD
5. ❌ `POST /api/workspaces/discover` - NEED TO ADD (or use existing list endpoint)

### Medium Priority
6. ❌ `GET /api/workspaces/{id}/content` - For search functionality
7. ❌ `GET /api/search?workspace_id={id}&query={text}` - Global search

---

## Migration Order

### Phase 1: Core Components (Start Here) ✅
1. **FormBuilder.tsx** - Most important, most queries
2. **layout-wrapper.tsx** - Add slug endpoint first
3. **useWorkspaceDiscovery.ts** - Update to use existing API
4. **NavigationLayout.tsx** - Easy, minimal changes

### Phase 2: Advanced Features
5. **hybrid-search-engine.ts** - Requires new content endpoint
6. **YjsFormBuilder.tsx** - Can deprecate or defer

---

## Schema Mapping

### Old Schema → New Schema
| Old Table | New Table/Approach |
|-----------|-------------------|
| `forms` | `forms` ✅ (same) |
| `form_structure` | Removed - use `form_fields` array in forms |
| `form_fields` | `form_fields` ✅ (same) |
| `workspaces` | `workspaces` ✅ (same) |
| `workspace_content` | Aggregate view of `forms` + `data_tables` |
| `yjs_documents` | Out of scope (real-time collab) |

---

## API Client Usage Examples

### Before (Supabase):
```typescript
const { data: form } = await supabase
  .from('forms')
  .select('*, form_structure(structure)')
  .eq('id', formId)
  .single()
```

### After (FastAPI):
```typescript
import { formsAPI } from '@/lib/api/forms-client'

const form = await formsAPI.get(formId)
// form.fields array already included
```

---

## Next Steps

1. ✅ Create forms API client (similar to data-tables-client)
2. ✅ Migrate FormBuilder.tsx as proof of concept
3. Add missing workspace endpoints (by-slug, discover)
4. Test migrated FormBuilder end-to-end
5. Repeat for remaining files

---

## Notes

- **Authentication**: Keep Supabase Auth - no migration needed
- **Real-time**: YJS/collaboration features deferred
- **Search**: Needs backend full-text search implementation
- **File uploads**: Table attachments API exists but needs testing

