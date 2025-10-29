#!/bin/bash

# Request Hub Migration Runner
# This script helps you run the request hub migration in Supabase

echo "🚀 Request Hub Database Migration"
echo "=================================="
echo ""
echo "To run this migration, follow these steps:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to: SQL Editor"
echo "3. Copy the contents of: docs/migrations/004_create_request_hubs.sql"
echo "4. Paste into the SQL Editor"
echo "5. Click 'Run' to execute the migration"
echo ""
echo "Or use the Supabase CLI:"
echo ""
echo "  supabase db push docs/migrations/004_create_request_hubs.sql"
echo ""
echo "=================================="
echo ""
echo "📋 Migration will create:"
echo "  - request_hubs table"
echo "  - request_hub_tabs table"
echo "  - Indexes for performance"
echo "  - RLS policies for workspace access"
echo ""
echo "After running the migration, the Request Hub module will be fully functional!"
