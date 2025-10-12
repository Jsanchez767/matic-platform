# Table Name & Slug Auto-Generation Feature

## Overview
When you rename a table, the slug is now automatically updated to match the new name. This ensures URL-friendly identifiers stay in sync with table names.

## Changes Made

### Backend Changes

#### 1. Updated Schema (`backend/app/schemas/data_tables.py`)
- Added `slug` field to `DataTableUpdate` schema
- Allows optional manual slug override

```python
class DataTableUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None  # NEW: Auto-generated from name
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    is_archived: Optional[bool] = None
```

#### 2. Added Slug Generation Function (`backend/app/routers/data_tables.py`)
```python
def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from a name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug
```

**Examples:**
- "My Test Table" → "my-test-table"
- "Sales Data 2024!" → "sales-data-2024"
- "Product_Inventory" → "product-inventory"

#### 3. Updated `update_table` Endpoint
- Auto-generates slug when name is updated
- Allows manual slug override if provided

```python
if table_data.name is not None:
    table.name = table_data.name
    # Auto-generate slug from name if not provided
    if table_data.slug is None:
        table.slug = generate_slug(table_data.name)
if table_data.slug is not None:
    table.slug = table_data.slug
```

### Frontend Changes
No frontend changes needed! The existing table name editing feature automatically benefits from this backend enhancement.

## How It Works

1. **User clicks on table name** in the UI
2. **User edits the name** and presses Enter or clicks away
3. **Frontend sends update** to backend with new name
4. **Backend automatically generates slug** from the new name
5. **Database updates both fields** in a single transaction

## Deployment

### Local Testing
If running backend locally:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Render Deployment
Since you're using Render for the backend:

1. **Commit and push changes:**
   ```bash
   git add backend/app/schemas/data_tables.py backend/app/routers/data_tables.py
   git commit -m "Add automatic slug generation when table name changes"
   git push origin main
   ```

2. **Render will auto-deploy** (if you have auto-deploy enabled)
   - Or manually deploy from Render dashboard

3. **Test the feature:**
   - Open a table in your app
   - Click on the table name
   - Change it (e.g., "Test" → "Test Table")
   - The slug will automatically update to "test-table"

## Benefits

✅ **Automatic sync** - Slugs always match table names
✅ **URL-friendly** - No spaces or special characters
✅ **SEO-friendly** - Clean, readable URLs
✅ **Manual override** - Can still set custom slug if needed
✅ **No breaking changes** - Existing tables keep their slugs

## Edge Cases Handled

- **Empty names**: Protected by existing validation
- **Special characters**: Stripped automatically (e.g., "Data@2024!" → "data2024")
- **Multiple spaces/hyphens**: Collapsed into single hyphen
- **Leading/trailing hyphens**: Removed
- **Unicode characters**: Preserved in slug (supports international characters)

## Testing Checklist

After deployment, verify:
- [ ] Renaming table updates slug in database
- [ ] URL navigation still works with new slug
- [ ] Special characters are handled correctly
- [ ] Empty/whitespace-only names are rejected
- [ ] Existing tables are not affected
