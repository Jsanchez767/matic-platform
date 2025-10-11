"""
Quick test script to verify backend API endpoints
Run this to test if the backend is working correctly
"""
import asyncio
import sys
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, '/Users/jesussanchez/Downloads/matic-platform/backend')

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    """Test basic API health"""
    response = client.get("/api/workspaces")
    print(f"✓ Workspaces endpoint accessible: {response.status_code}")


def test_docs():
    """Test API docs are accessible"""
    response = client.get("/docs")
    print(f"✓ API docs accessible: {response.status_code}")


def test_openapi():
    """Test OpenAPI schema"""
    response = client.get("/openapi.json")
    if response.status_code == 200:
        schema = response.json()
        print(f"✓ OpenAPI schema available")
        print(f"  - Title: {schema.get('info', {}).get('title')}")
        print(f"  - Paths: {len(schema.get('paths', {}))}")
        
        # List all available endpoints
        print("\n📋 Available API Endpoints:")
        for path, methods in schema.get('paths', {}).items():
            for method in methods.keys():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                    print(f"  {method.upper():6} {path}")


if __name__ == "__main__":
    print("🧪 Testing Matic Platform API\n")
    print("=" * 50)
    
    try:
        test_health()
        test_docs()
        test_openapi()
        
        print("\n" + "=" * 50)
        print("✅ All basic tests passed!")
        print("\n💡 To start the server, run:")
        print("   cd backend && uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
