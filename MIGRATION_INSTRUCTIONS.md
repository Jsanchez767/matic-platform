# Database Migration Instructions

## Issue
The `'link'` column type is not allowed in the `table_columns` table due to a missing check constraint value.

## Error
```
sqlalchemy.exc.IntegrityError: new row for relation "table_columns" violates check constraint "table_columns_column_type_check"
```

## Solution
Run the following SQL in your Supabase SQL editor:

```sql
-- Step 1: Drop the existing check constraint
ALTER TABLE table_columns DROP CONSTRAINT table_columns_column_type_check;

-- Step 2: Add the new check constraint with 'link' included
ALTER TABLE table_columns ADD CONSTRAINT table_columns_column_type_check 
CHECK (column_type IN (
    'text', 'number', 'email', 'url', 'phone',
    'select', 'multiselect', 'checkbox',
    'date', 'datetime',
    'attachment', 'image',
    'user', 'formula', 'rollup', 'lookup', 'link',
    'rating', 'currency', 'percent',
    'duration', 'barcode', 'button'
));
```

## How to Apply
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Paste the above SQL commands
4. Run the migration
5. Verify by trying to create a link column again

## Verification
After running the migration, you should be able to:
- Create columns with `column_type = 'link'`
- Set `linked_table_id` values
- Use the link field functionality in the frontend

The migration adds `'link'` to the allowed column types while keeping all existing functionality intact.