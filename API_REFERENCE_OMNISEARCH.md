# OmniSearch API Reference

Quick reference guide for the OmniSearch backend API endpoints.

## Base URL

**Development**: `http://localhost:8000/api/v1`  
**Production**: `https://backend.maticslab.com/api/v1`

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Universal workspace search |
| GET | `/search/suggestions` | Auto-complete suggestions |
| GET | `/search/recent` | Recent search history |
| POST | `/search/history` | Save search to history |
| GET | `/search/popular` | Popular searches (30 days) |
| DELETE | `/search/history/:workspace_id` | Clear search history |
| GET | `/tables/:id/search` | Search table rows |
| GET | `/forms/:id/search` | Search form submissions |

---

## 1. Universal Search

Search across all workspace entities: tables, forms, request hubs, and table rows.

**Endpoint**: `GET /api/v1/search`

### Query Parameters
- `q` (required) - Search query string
- `workspace_id` (required) - UUID of the workspace

### Example Request
```bash
curl "http://localhost:8000/api/v1/search?q=customer&workspace_id=123e4567-e89b-12d3-a456-426614174000"
```

### Example Response
```json
{
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "type": "table",
      "title": "Customer Database",
      "subtitle": "Track all customer information",
      "url": "/workspace/my-workspace/table/customer-database",
      "path": ["Workspace", "Tables", "Customer Database"],
      "score": 1.0,
      "metadata": {
        "column_count": 12,
        "row_count": 450,
        "created_at": "2024-01-15T10:30:00Z"
      }
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "type": "form",
      "title": "Customer Feedback Form",
      "subtitle": "Collect customer satisfaction data",
      "url": "/workspace/my-workspace/form/customer-feedback",
      "path": ["Workspace", "Forms", "Customer Feedback"],
      "score": 0.9,
      "metadata": {
        "submission_count": 234,
        "created_at": "2024-02-01T14:20:00Z"
      }
    }
  ],
  "query": "customer",
  "total": 15,
  "search_time_ms": 145
}
```

### Result Types
- `table` - Data table
- `form` - Form definition
- `request_hub` - Request hub
- `table_row` - Individual table row

### Score Meaning
- `1.0` - Exact match
- `0.9` - Starts with query
- `0.7` - Contains query
- `0.6` - Fuzzy word match

---

## 2. Search Suggestions

Get auto-complete suggestions based on entity names.

**Endpoint**: `GET /api/v1/search/suggestions`

### Query Parameters
- `q` (required) - Partial search query
- `workspace_id` (required) - UUID of the workspace
- `limit` (optional) - Max suggestions (default: 5)

### Example Request
```bash
curl "http://localhost:8000/api/v1/search/suggestions?q=cust&workspace_id=123e4567-e89b-12d3-a456-426614174000&limit=5"
```

### Example Response
```json
{
  "suggestions": [
    "Customer Database",
    "Customer Feedback Form",
    "Customer Support Hub",
    "Customer Analytics",
    "Customer Onboarding"
  ]
}
```

---

## 3. Recent Searches

Retrieve recent unique search queries for a workspace.

**Endpoint**: `GET /api/v1/search/recent`

### Query Parameters
- `workspace_id` (required) - UUID of the workspace
- `limit` (optional) - Max results (default: 10)

### Example Request
```bash
curl "http://localhost:8000/api/v1/search/recent?workspace_id=123e4567-e89b-12d3-a456-426614174000&limit=10"
```

### Example Response
```json
{
  "searches": [
    "customer data",
    "support tickets",
    "product feedback",
    "sales report",
    "user analytics"
  ]
}
```

---

## 4. Save Search History

Persist a search query to the database for analytics.

**Endpoint**: `POST /api/v1/search/history`

### Request Body
```json
{
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "query": "customer data",
  "result_count": 25,
  "user_id": "123e4567-e89b-12d3-a456-426614174999"
}
```

### Example Request
```bash
curl -X POST http://localhost:8000/api/v1/search/history \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "query": "customer data",
    "result_count": 25
  }'
```

### Example Response
```json
{
  "id": "123e4567-e89b-12d3-a456-426614175000",
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "query": "customer data",
  "result_count": 25,
  "created_at": "2024-03-15T16:45:30Z"
}
```

---

## 5. Popular Searches

Get the most popular searches in the last 30 days.

**Endpoint**: `GET /api/v1/search/popular`

### Query Parameters
- `workspace_id` (required) - UUID of the workspace
- `limit` (optional) - Max results (default: 5)

### Example Request
```bash
curl "http://localhost:8000/api/v1/search/popular?workspace_id=123e4567-e89b-12d3-a456-426614174000&limit=5"
```

### Example Response
```json
{
  "popular": [
    {
      "query": "customer data",
      "count": 145
    },
    {
      "query": "support tickets",
      "count": 89
    },
    {
      "query": "product feedback",
      "count": 67
    },
    {
      "query": "sales report",
      "count": 54
    },
    {
      "query": "user analytics",
      "count": 42
    }
  ]
}
```

---

## 6. Clear Search History

Delete all search history for a workspace.

**Endpoint**: `DELETE /api/v1/search/history/:workspace_id`

### Path Parameters
- `workspace_id` (required) - UUID of the workspace

### Example Request
```bash
curl -X DELETE "http://localhost:8000/api/v1/search/history/123e4567-e89b-12d3-a456-426614174000"
```

### Example Response
```json
{
  "message": "Search history cleared"
}
```

---

## 7. Search Table Rows

Search within a specific table's rows.

**Endpoint**: `GET /api/v1/tables/:id/search`

### Path Parameters
- `id` (required) - UUID of the table

### Query Parameters
- `q` (required) - Search query string
- `columns` (optional) - Comma-separated column names to filter

### Example Request
```bash
# Search all columns
curl "http://localhost:8000/api/v1/tables/123e4567-e89b-12d3-a456-426614174001/search?q=john"

# Search specific columns
curl "http://localhost:8000/api/v1/tables/123e4567-e89b-12d3-a456-426614174001/search?q=john&columns=name,email"
```

### Example Response
```json
{
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614176001",
      "type": "table_row",
      "title": "John Doe - john@example.com",
      "subtitle": "Customer since 2023",
      "url": "/workspace/my-workspace/table/customers/row/123e4567-e89b-12d3-a456-426614176001",
      "path": ["Workspace", "Customer Database", "Row"],
      "score": 0.95,
      "metadata": {
        "table_id": "123e4567-e89b-12d3-a456-426614174001",
        "table_name": "Customer Database"
      }
    }
  ],
  "query": "john",
  "total": 12,
  "search_time_ms": 87
}
```

---

## 8. Search Form Submissions

Search within a specific form's submissions.

**Endpoint**: `GET /api/v1/forms/:id/search`

### Path Parameters
- `id` (required) - UUID of the form

### Query Parameters
- `q` (required) - Search query string
- `fields` (optional) - Comma-separated field names to filter

### Example Request
```bash
# Search all fields
curl "http://localhost:8000/api/v1/forms/123e4567-e89b-12d3-a456-426614174002/search?q=satisfied"

# Search specific fields
curl "http://localhost:8000/api/v1/forms/123e4567-e89b-12d3-a456-426614174002/search?q=satisfied&fields=rating,comments"
```

### Example Response
```json
{
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614177001",
      "type": "form_submission",
      "title": "Feedback: Very satisfied with service",
      "subtitle": "Submitted 2 days ago",
      "url": "/workspace/my-workspace/form/feedback/submission/123e4567-e89b-12d3-a456-426614177001",
      "path": ["Workspace", "Customer Feedback", "Submission"],
      "score": 0.85,
      "metadata": {
        "form_id": "123e4567-e89b-12d3-a456-426614174002",
        "form_name": "Customer Feedback Form",
        "submitted_at": "2024-03-13T09:15:00Z"
      }
    }
  ],
  "query": "satisfied",
  "total": 8,
  "search_time_ms": 65
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid workspace_id"
}
```

### 404 Not Found
```json
{
  "error": "Table not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to execute search query"
}
```

---

## Search Algorithm

### Scoring
1. **Exact Match** (1.0)
   - Query exactly matches entity name

2. **Prefix Match** (0.9)
   - Entity name starts with query

3. **Contains Match** (0.7)
   - Entity name contains query

4. **Fuzzy Match** (0.6 * ratio)
   - Word-by-word matching
   - Ratio = matching words / total words

### Sorting
- Results sorted by score (highest first)
- Limited to top 50 results

### Case Sensitivity
- All searches are case-insensitive
- Uses PostgreSQL `ILIKE` operator

### JSONB Search
- Table rows and form submissions
- Searches within JSON data fields
- Uses `data::text LIKE` for full content search

---

## Authentication

**Status**: Not yet implemented  
**Recommendation**: Add JWT middleware to verify tokens

Example future implementation:
```bash
curl "http://localhost:8000/api/v1/search?q=customer&workspace_id=xxx" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rate Limiting

**Status**: Not implemented  
**Recommendation**: Add rate limiting to prevent abuse

Suggested limits:
- 100 requests per minute per user
- 1000 requests per hour per workspace

---

## CORS

**Configured domains**:
- `http://localhost:3000` (development)
- `https://matic-platform.vercel.app`
- `https://www.maticsapp.com`
- `https://maticsapp.com`

---

## Performance Tips

### For Fast Searches
1. Use specific column/field filters when possible
2. Keep queries short (2-3 words max)
3. Use suggestions endpoint for auto-complete
4. Implement debouncing on frontend (150ms recommended)

### For Large Datasets
1. Add database indexes on name/description columns
2. Add GIN indexes on JSONB columns
3. Consider caching popular searches
4. Implement pagination for >50 results

---

## Testing with curl

### Test All Endpoints
```bash
# Set your workspace ID
WORKSPACE_ID="123e4567-e89b-12d3-a456-426614174000"

# Test universal search
curl "http://localhost:8000/api/v1/search?q=customer&workspace_id=${WORKSPACE_ID}"

# Test suggestions
curl "http://localhost:8000/api/v1/search/suggestions?q=cust&workspace_id=${WORKSPACE_ID}"

# Test recent searches
curl "http://localhost:8000/api/v1/search/recent?workspace_id=${WORKSPACE_ID}"

# Test save history
curl -X POST http://localhost:8000/api/v1/search/history \
  -H "Content-Type: application/json" \
  -d "{\"workspace_id\":\"${WORKSPACE_ID}\",\"query\":\"test\",\"result_count\":5}"

# Test popular searches
curl "http://localhost:8000/api/v1/search/popular?workspace_id=${WORKSPACE_ID}"
```

### Pretty Print with jq
```bash
curl -s "http://localhost:8000/api/v1/search?q=customer&workspace_id=${WORKSPACE_ID}" | jq '.'
```

---

## Need Help?

- **Full Documentation**: See `OMNISEARCH_BACKEND_COMPLETE.md`
- **Testing Script**: Run `./test_omnisearch.sh`
- **Frontend Integration**: See `docs/OMNISEARCH.md`
- **Deployment Guide**: See `OMNISEARCH_CHECKLIST.md`
