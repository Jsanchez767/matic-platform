#!/usr/bin/env python3
"""
Run Request Hub migration against Supabase database.

This script executes the 004_create_request_hubs.sql migration.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db.session import engine


async def run_migration():
    """Execute the request hub migration."""
    
    # Read migration file
    migration_file = Path(__file__).parent.parent.parent / "docs" / "migrations" / "004_create_request_hubs.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"📄 Reading migration from: {migration_file}")
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    print("🔌 Connecting to database...")
    
    async with engine.begin() as conn:
        print("🚀 Executing migration...")
        
        try:
            # Execute the migration
            await conn.execute(text(migration_sql))
            print("✅ Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return False


async def check_tables():
    """Check if the tables were created."""
    
    async with engine.connect() as conn:
        # Check for request_hubs table
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'request_hubs'
            );
        """))
        request_hubs_exists = result.scalar()
        
        # Check for request_hub_tabs table
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'request_hub_tabs'
            );
        """))
        request_hub_tabs_exists = result.scalar()
        
        print("\n📊 Table Status:")
        print(f"  • request_hubs: {'✅ Exists' if request_hubs_exists else '❌ Not found'}")
        print(f"  • request_hub_tabs: {'✅ Exists' if request_hub_tabs_exists else '❌ Not found'}")
        
        return request_hubs_exists and request_hub_tabs_exists


async def main():
    """Main execution."""
    
    print("=" * 60)
    print("Request Hub Migration Script")
    print("=" * 60)
    print()
    
    # Check if tables already exist
    print("🔍 Checking existing tables...")
    tables_exist = await check_tables()
    
    if tables_exist:
        print("\n⚠️  Tables already exist. Skipping migration.")
        print("   (If you need to re-run, drop the tables first)")
        return
    
    print("\n📋 Tables not found. Running migration...\n")
    
    # Run migration
    success = await run_migration()
    
    if success:
        # Verify tables were created
        print("\n🔍 Verifying migration...")
        tables_exist = await check_tables()
        
        if tables_exist:
            print("\n" + "=" * 60)
            print("🎉 Migration completed successfully!")
            print("=" * 60)
            print()
            print("Next steps:")
            print("  1. Start the backend: cd backend && uvicorn app.main:app --reload")
            print("  2. Test endpoints: http://localhost:8000/docs")
            print("  3. Create a request hub from the UI")
        else:
            print("\n⚠️  Migration executed but tables not found.")
            print("   Check the database logs for errors.")
    else:
        print("\n❌ Migration failed. Check the error above.")


if __name__ == "__main__":
    asyncio.run(main())
