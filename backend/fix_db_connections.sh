#!/bin/bash

# Database Connection Fix Deployment Script

echo "🔧 Deploying database connection fixes..."

# Create environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "⚠️  No .env file found in backend/"
    echo "📝 Please create backend/.env with:"
    echo "   DATABASE_URL=your_supabase_connection_string"
    echo "   ENVIRONMENT=production"
    echo "   DEBUG=false"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/app/main.py" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
cd backend
pip install -r requirements.txt

# Test the application locally
echo "🧪 Testing application startup..."
timeout 10s python -c "
import asyncio
from app.main import app
from app.db.session import engine

async def test_db():
    try:
        # Test engine creation
        print('✅ Engine created successfully')
        
        # Test connection
        async with engine.begin() as conn:
            result = await conn.execute('SELECT 1')
            print('✅ Database connection successful')
        
        await engine.dispose()
        print('✅ All tests passed')
        
    except Exception as e:
        print(f'❌ Test failed: {e}')
        exit(1)

asyncio.run(test_db())
"

if [ $? -eq 0 ]; then
    echo "✅ Database connection tests passed!"
else
    echo "❌ Database connection tests failed"
    echo "🔍 Check your DATABASE_URL and ensure Supabase is accessible"
    exit 1
fi

# Start the server
echo "🚀 Starting FastAPI server..."
echo "📊 Monitor at: http://localhost:8000/api/health/detailed"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000