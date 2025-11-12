#!/bin/bash

# OmniSearch Backend Testing Script
# Replace YOUR_WORKSPACE_UUID with an actual workspace UUID from your database

BASE_URL="http://localhost:8000/api/v1"
WORKSPACE_ID="YOUR_WORKSPACE_UUID"
TABLE_ID="YOUR_TABLE_UUID"
FORM_ID="YOUR_FORM_UUID"

echo "🔍 Testing OmniSearch Backend Endpoints"
echo "========================================"
echo ""

# Test 1: Universal Search
echo "1️⃣ Testing Universal Search..."
curl -s "${BASE_URL}/search?q=customer&workspace_id=${WORKSPACE_ID}" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Search Suggestions
echo "2️⃣ Testing Search Suggestions..."
curl -s "${BASE_URL}/search/suggestions?q=cust&workspace_id=${WORKSPACE_ID}&limit=5" | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Table Row Search
echo "3️⃣ Testing Table Row Search..."
curl -s "${BASE_URL}/tables/${TABLE_ID}/search?q=john" | jq '.'
echo ""
echo "---"
echo ""

# Test 4: Form Submission Search
echo "4️⃣ Testing Form Submission Search..."
curl -s "${BASE_URL}/forms/${FORM_ID}/search?q=feedback" | jq '.'
echo ""
echo "---"
echo ""

# Test 5: Save Search History
echo "5️⃣ Testing Save Search History..."
curl -s -X POST "${BASE_URL}/search/history" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"${WORKSPACE_ID}\",
    \"query\": \"test search\",
    \"result_count\": 10
  }" | jq '.'
echo ""
echo "---"
echo ""

# Test 6: Recent Searches
echo "6️⃣ Testing Recent Searches..."
curl -s "${BASE_URL}/search/recent?workspace_id=${WORKSPACE_ID}&limit=10" | jq '.'
echo ""
echo "---"
echo ""

# Test 7: Popular Searches
echo "7️⃣ Testing Popular Searches..."
curl -s "${BASE_URL}/search/popular?workspace_id=${WORKSPACE_ID}&limit=5" | jq '.'
echo ""
echo "---"
echo ""

# Test 8: API Documentation
echo "8️⃣ Testing API Documentation..."
curl -s "${BASE_URL}/docs" | jq '.endpoints.search'
echo ""
echo "---"
echo ""

echo "✅ All tests complete!"
echo ""
echo "📝 Notes:"
echo "  - Replace YOUR_WORKSPACE_UUID with an actual workspace UUID"
echo "  - Replace YOUR_TABLE_UUID and YOUR_FORM_UUID for specific tests"
echo "  - Ensure the backend is running on http://localhost:8000"
echo "  - Install jq for pretty JSON output: brew install jq"
