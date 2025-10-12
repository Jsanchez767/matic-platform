# Link Table Field Feature

## Overview
The **Link to another table** field type allows you to create relationships between tables, similar to Airtable's linked records feature. This enables you to connect records across different tables and build relational data structures.

## Changes Made

### Frontend Changes

#### 1. ColumnEditorModal (`src/components/Tables/ColumnEditorModal.tsx`)

**Added:**
- New column type: `link` - "Link to another table"
- Import `Link2` icon from lucide-react
- State management for linked tables:
  - `linkedTableId` - stores the selected table to link to
  - `availableTables` - list of tables in the workspace
  - `loadingTables` - loading state
- `useEffect` hook to load available tables when link type is selected
- `loadAvailableTables()` function to fetch tables from API
- UI for selecting which table to link to (dropdown with all workspace tables)
- Validation to ensure a table is selected before saving
- Filters out current table from available options

**Key Code:**
```tsx
{columnType === 'link' && (
  <div>
    <label>Select table to link</label>
    <select value={linkedTableId} onChange={(e) => setLinkedTableId(e.target.value)}>
      <option value="">Choose a table...</option>
      {availableTables.map(table => (
        <option key={table.id} value={table.id}>{table.name}</option>
      ))}
    </select>
  </div>
)}
```

#### 2. TableGridView (`src/components/Tables/TableGridView.tsx`)

**Added:**
- `linked_table_id` field to `Column` interface
- Props passed to `ColumnEditorModal`: `workspaceId` and `currentTableId`
- Cell rendering for link column type with:
  - Purple-themed UI (distinguishes from blue multi-select)
  - Display linked record IDs as chips with 🔗 icon
  - Click to open dropdown for managing links
  - Search functionality for finding records
  - Remove individual links with × button
  - "No links" placeholder when empty

**Visual Design:**
- Purple badges for linked records (vs blue for multi-select)
- Hover state with purple background
- Record IDs displayed as shortened strings (first 8 characters)
- Consistent with existing multi-select UI pattern

### Backend Structure (Already Exists)

The database already has the complete infrastructure for table linking:

#### Models (`backend/app/models/data_table.py`)

**TableColumn:**
- `linked_table_id` - UUID of the target table
- `linked_column_id` - UUID of specific column (optional)
- Supports lookup and rollup functions

**TableLink:**
- `source_table_id` - The table initiating the link
- `source_column_id` - The column with the link field
- `target_table_id` - The table being linked to
- `target_column_id` - Optional target column
- `link_type` - 'one_to_one', 'one_to_many', or 'many_to_many'
- `settings` - Additional configuration

**TableRowLink:**
- `link_id` - Reference to TableLink
- `source_row_id` - The row with the link
- `target_row_id` - The linked row
- `metadata` - Additional link metadata

## How It Works

### Creating a Link Field

1. **User opens column editor** (+ button in table header)
2. **Selects "Link to another table"** from column types
3. **Chooses target table** from dropdown (shows all workspace tables except current)
4. **Names the field** (e.g., "Related Projects", "Assigned User")
5. **Saves** - Column is created with `column_type: 'link'` and `linked_table_id`

### Using a Link Field

1. **Click on a link cell** - Opens dropdown interface
2. **Search for records** - Find records from linked table
3. **Select records** - Click to add links (supports multiple)
4. **View linked records** - Shows as purple chips with record ID
5. **Remove links** - Click × on individual chips

## Database Schema

### When User Creates Link Column:
```sql
-- Creates a column
INSERT INTO table_columns (
  table_id,
  name,
  label,
  column_type,  -- 'link'
  linked_table_id  -- UUID of target table
)

-- Optionally creates a TableLink record (for relationship metadata)
INSERT INTO table_links (
  source_table_id,
  source_column_id,
  target_table_id,
  link_type  -- 'one_to_many' by default
)
```

### When User Links Records:
```sql
-- Creates row link
INSERT INTO table_row_links (
  link_id,  -- Reference to table_links
  source_row_id,  -- Current row
  target_row_id  -- Linked row
)
```

### Data Storage:
Currently, linked record IDs are stored in the `data` JSONB field of `table_rows`:
```json
{
  "name": "Task 1",
  "related_projects": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## Features Implemented

✅ **Column Creation:**
- Add link column type with table selector
- Validates table selection before saving
- Shows all available tables in workspace

✅ **UI Rendering:**
- Purple-themed chips for linked records
- Click to edit/add links
- Remove individual links
- Empty state placeholder

✅ **Backend Support:**
- Database schema complete (TableLink, TableRowLink)
- Columns support `linked_table_id` field
- Ready for relationship queries

## Features Coming Soon

The basic structure is in place, but these features need implementation:

### 1. Load Actual Records in Dropdown
Currently shows "Loading linked records..." placeholder. Need to:
- Fetch rows from `linked_table_id` table
- Display record names/primary field values
- Allow searching through records
- Handle pagination for large datasets

**Implementation:**
```tsx
// In TableGridView.tsx, add:
const [linkedRecords, setLinkedRecords] = useState<any[]>([])

useEffect(() => {
  if (isEditing && column.column_type === 'link' && column.linked_table_id) {
    loadLinkedRecords(column.linked_table_id)
  }
}, [isEditing, column])

const loadLinkedRecords = async (tableId: string) => {
  const records = await rowsAPI.list(tableId)
  setLinkedRecords(records)
}
```

### 2. Create TableLink Records
When a link column is created, also create a `TableLink` record:
- Store relationship metadata
- Support bi-directional links
- Track link type (one-to-many, many-to-many)

**Backend Endpoint Needed:**
```python
@router.post("/tables/{table_id}/links")
async def create_table_link(
    table_id: UUID,
    link_data: TableLinkCreate,
    session: AsyncSession = Depends(get_session)
):
    # Create TableLink record
    pass
```

### 3. Create TableRowLink Records
When linking records, create proper `table_row_links` entries:
- Replace JSONB array storage
- Enable efficient querying
- Support link metadata

**Backend Endpoint Needed:**
```python
@router.post("/tables/{table_id}/rows/{row_id}/links")
async def link_records(
    table_id: UUID,
    row_id: UUID,
    link_data: RowLinkCreate,
    session: AsyncSession = Depends(get_session)
):
    # Create TableRowLink record
    pass
```

### 4. Display Record Names Instead of IDs
Show meaningful names like "Project Alpha" instead of "uuid-abc123":
- Fetch linked record data
- Use primary column or name field
- Cache for performance

### 5. Bi-directional Links
When linking A → B, optionally create B → A:
- Two-way relationship
- Configurable in settings
- Automatic backlink creation

### 6. Link Type Selection
Allow choosing relationship type:
- One-to-one
- One-to-many
- Many-to-many

### 7. Lookup Fields
Use linked records in formulas:
- `{Linked Record}.field_name`
- Rollup functions (count, sum, average)
- Supported in backend schema, needs frontend UI

## API Endpoints

### Existing Endpoints Used:
- `GET /api/tables?workspace_id={id}` - List tables for dropdown
- `GET /api/tables/{id}/rows` - Could fetch linked records
- `PUT /api/tables/{table_id}/rows/{row_id}` - Save linked IDs in data field

### New Endpoints Needed:

```python
# Create relationship
POST /api/tables/{table_id}/links
{
  "target_table_id": "uuid",
  "link_type": "one_to_many",
  "is_bidirectional": true
}

# Link two records
POST /api/tables/{table_id}/rows/{row_id}/links
{
  "target_row_id": "uuid",
  "link_id": "uuid"  # Optional: reference to TableLink
}

# Get linked records for a row
GET /api/tables/{table_id}/rows/{row_id}/links

# Remove a link
DELETE /api/tables/{table_id}/rows/{row_id}/links/{link_id}

# Get records from linked table with filtering
GET /api/tables/{table_id}/linked-records?column_id={id}&search={query}
```

## Usage Example

### Creating a CRM with Related Tables

**Companies Table:**
- Name (text)
- Industry (select)

**Contacts Table:**
- Name (text)
- Email (email)
- Company (link → Companies table)

**Deals Table:**
- Name (text)
- Value (currency)
- Company (link → Companies table)
- Contact (link → Contacts table)

### User Flow:
1. Create "Companies" table
2. Create "Contacts" table
3. Add "Company" column to Contacts → select "Link to another table" → choose "Companies"
4. Open a Contact record → click Company field → search for company → select
5. Company is now linked! Shows as purple chip with company name

## Testing Checklist

After full implementation:
- [ ] Create a link column
- [ ] Select target table from dropdown
- [ ] Save column configuration
- [ ] Click on link cell
- [ ] Search for records in linked table
- [ ] Add a link to another record
- [ ] Add multiple links
- [ ] Remove a link
- [ ] Verify data persists after refresh
- [ ] Check database for table_row_links entries
- [ ] Test with different relationship types
- [ ] Test bi-directional links

## Technical Notes

### Why JSONB vs table_row_links?
Current implementation stores linked IDs in JSONB `data` field:
```json
{ "linked_column": ["uuid1", "uuid2"] }
```

**Pros:**
- Simple to implement
- Fast for small datasets
- Backwards compatible

**Cons:**
- Can't query efficiently
- No relationship metadata
- Limited to simple links

**Recommendation:** Migrate to `table_row_links` table for production use.

### Performance Considerations
- Loading all records from large linked tables may be slow
- Implement pagination/infinite scroll in dropdown
- Cache frequently accessed linked records
- Index `table_row_links` on `source_row_id` and `target_row_id`

### Security
- Verify user has access to both tables before creating link
- Check permissions when displaying linked records
- Validate link relationships exist

## Next Steps

1. **Implement record loading** - Fetch and display actual records from linked table
2. **Create backend endpoints** - Add API routes for table_row_links
3. **Add record picker** - Better UI for selecting records (with search, preview)
4. **Display record names** - Show meaningful titles instead of UUIDs
5. **Add relationship metadata** - Create TableLink records on column creation
6. **Test thoroughly** - Ensure data integrity and performance

## Related Files

- `src/components/Tables/ColumnEditorModal.tsx` - Column configuration UI
- `src/components/Tables/TableGridView.tsx` - Cell rendering and editing
- `backend/app/models/data_table.py` - Database models
- `backend/app/schemas/data_tables.py` - API schemas
- `backend/app/routers/data_tables.py` - API endpoints
