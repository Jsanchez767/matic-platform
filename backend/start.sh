#!/bin/bash

# Quick start script for Matic Platform Backend
# This script will help you get the server running quickly

set -e  # Exit on error

echo "🚀 Matic Platform Backend - Quick Start"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend/ directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv ../.venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source ../.venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Update your DATABASE_URL in .env file"
    echo "   Current value: postgresql+asyncpg://postgres:postgres@localhost:5432/matic"
    echo ""
fi

# Check database connectivity (optional)
echo "🔍 Testing imports..."
python -c "from app.main import app; print('✓ All imports successful')" 2>&1 | grep -q "successful" && echo "✓ Backend code is valid" || echo "⚠️  There may be import issues"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Make sure PostgreSQL is running"
echo "   2. Update DATABASE_URL in .env if needed"
echo "   3. Run the schema: psql < ../001_initial_schema.sql"
echo ""
echo "🎯 To start the server:"
echo "   uvicorn app.main:app --reload"
echo ""
echo "📚 Then visit:"
echo "   API Docs: http://localhost:8000/docs"
echo "   OpenAPI:  http://localhost:8000/openapi.json"
echo ""
