# OmniSearch Implementation Guide

## Overview

OmniSearch is a powerful, Notion/Slack-style universal search component that allows users to search across all workspace entities and perform quick actions.

## Features

✅ **Universal Search**
- Search across tables, forms, request hubs
- Search within table rows and form submissions
- Search by name, description, content, and metadata

✅ **Quick Actions**
- Create new table, form, or request hub
- Navigate to any workspace entity
- Keyboard shortcuts for common actions

✅ **Smart Navigation**
- Recent searches with quick access
- Popular searches in workspace
- Search suggestions as you type

✅ **Rich Results**
- Categorized results (Tables, Forms, Hubs, Rows, etc.)
- Result metadata (column count, submission count, timestamps)
- Breadcrumb paths showing entity hierarchy
- Secondary actions (edit, duplicate, open in new tab)

✅ **Keyboard Navigation**
- `Cmd/Ctrl + K` to open search
- `↑↓` to navigate results
- `Enter` to select
- `ESC` to close

## Installation

### 1. Import Components

```tsx
import { OmniSearch } from '@/components/OmniSearch'
import { useOmniSearch } from '@/hooks/useOmniSearch'
```

### 2. Basic Usage

```tsx
export default function WorkspacePage() {
  const { isOpen, open, close } = useOmniSearch()
  
  return (
    <>
      {/* Your page content */}
      <button onClick={open}>
        Open Search (⌘K)
      </button>
      
      {/* OmniSearch Modal */}
      <OmniSearch
        isOpen={isOpen}
        onClose={close}
        workspaceId="workspace-uuid"
        workspaceSlug="workspace-slug"
      />
    </>
  )
}
```

### 3. Integration with Navigation

```tsx
'use client'

import { OmniSearch } from '@/components/OmniSearch'
import { useOmniSearch } from '@/hooks/useOmniSearch'
import { Search } from 'lucide-react'

export function NavigationBar({ workspaceId, workspaceSlug }) {
  const { isOpen, open, close } = useOmniSearch()
  
  return (
    <nav className="flex items-center gap-4">
      {/* Search Button */}
      <button
        onClick={open}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-1 text-xs bg-white rounded border">⌘K</kbd>
      </button>
      
      {/* Other nav items */}
      
      {/* OmniSearch Modal */}
      <OmniSearch
        isOpen={isOpen}
        onClose={close}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </nav>
  )
}
```

## API Integration

### Backend Endpoints Required

The OmniSearch component expects the following API endpoints:

#### 1. Universal Search
```
GET /api/search?q={query}&workspace_id={id}
```

Response:
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Customers Table",
      "subtitle": "Main customer database",
      "type": "table",
      "url": "/workspace/slug/table/uuid",
      "score": 0.95,
      "metadata": {
        "columnCount": 12,
        "rowCount": 150,
        "lastUpdated": "2025-11-12T10:30:00Z"
      },
      "path": "Workspace / Tables / Customers"
    }
  ],
  "total": 25,
  "query": "customer",
  "took": 45
}
```

#### 2. Table Row Search
```
GET /api/tables/{table_id}/search?q={query}
```

#### 3. Form Submission Search
```
GET /api/forms/{form_id}/search?q={query}
```

#### 4. Search Suggestions
```
GET /api/search/suggestions?q={query}&workspace_id={id}
```

Response:
```json
{
  "suggestions": [
    "customers table",
    "customer contact form",
    "customer feedback"
  ]
}
```

#### 5. Recent Searches
```
GET /api/search/recent?workspace_id={id}
```

#### 6. Popular Searches
```
GET /api/search/popular?workspace_id={id}
```

### Search Client Usage

```typescript
import { searchClient } from '@/lib/api/search-client'

// Search across workspace
const results = await searchClient.search('query', workspaceId)

// Search table rows
const rowResults = await searchClient.searchTableRows(tableId, 'query')

// Get suggestions
const suggestions = await searchClient.getSuggestions('que', workspaceId)

// Get recent searches
const recent = await searchClient.getRecentSearches(workspaceId)
```

## Customization

### Adding Custom Actions

```typescript
// In OmniSearch.tsx, add to getDefaultResults():
{
  id: 'custom-action',
  title: 'Custom Action',
  subtitle: 'Do something custom',
  icon: CustomIcon,
  type: 'action',
  category: 'Quick Actions',
  action: () => {
    // Your custom logic
    router.push('/custom-path')
    onClose()
  },
  shortcut: '⌘⇧C',
  keywords: ['custom', 'action']
}
```

### Styling

The component uses Tailwind CSS and can be customized via className props or by modifying the component directly.

Key color variables:
- Selected: `bg-blue-50 border-blue-200`
- Hover: `hover:bg-gray-50`
- Icon background: `bg-gray-100` (default), `bg-blue-500` (selected)

### Adding Secondary Actions

```typescript
{
  id: 'my-result',
  title: 'My Result',
  icon: FileText,
  type: 'table',
  category: 'Tables',
  action: () => openTable(),
  secondaryActions: [
    {
      label: 'Edit',
      icon: Edit,
      action: () => editTable()
    },
    {
      label: 'Share',
      icon: Share,
      action: () => shareTable()
    }
  ]
}
```

## Backend Implementation (Go)

### Search Handler Example

```go
// handlers/search.go
package handlers

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type SearchResult struct {
    ID          string                 `json:"id"`
    Title       string                 `json:"title"`
    Subtitle    string                 `json:"subtitle,omitempty"`
    Type        string                 `json:"type"`
    URL         string                 `json:"url"`
    Score       float64                `json:"score"`
    Metadata    map[string]interface{} `json:"metadata,omitempty"`
    Path        string                 `json:"path,omitempty"`
}

type SearchResponse struct {
    Results []SearchResult `json:"results"`
    Total   int            `json:"total"`
    Query   string         `json:"query"`
    Took    int            `json:"took"` // milliseconds
}

func SearchWorkspace(c *gin.Context) {
    query := c.Query("q")
    workspaceID := c.Query("workspace_id")
    
    if query == "" || workspaceID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Missing query or workspace_id"})
        return
    }
    
    var results []SearchResult
    
    // Search Tables
    var tables []models.DataTable
    db.Where("workspace_id = ? AND (name ILIKE ? OR description ILIKE ?)", 
        workspaceID, "%"+query+"%", "%"+query+"%").
        Limit(10).
        Find(&tables)
    
    for _, table := range tables {
        results = append(results, SearchResult{
            ID:       table.ID.String(),
            Title:    table.Name,
            Subtitle: table.Description,
            Type:     "table",
            URL:      fmt.Sprintf("/workspace/%s/table/%s", workspaceSlug, table.ID),
            Score:    calculateScore(table.Name, query),
            Metadata: map[string]interface{}{
                "columnCount": len(table.Columns),
            },
        })
    }
    
    // Search Forms (similar logic)
    // Search Request Hubs (similar logic)
    // Search Rows (more complex - search within JSONB data)
    
    c.JSON(http.StatusOK, SearchResponse{
        Results: results,
        Total:   len(results),
        Query:   query,
        Took:    10, // Calculate actual time
    })
}

func calculateScore(text, query string) float64 {
    lower := strings.ToLower(text)
    lowerQuery := strings.ToLower(query)
    
    // Exact match
    if strings.Contains(lower, lowerQuery) {
        if lower == lowerQuery {
            return 1.0
        }
        if strings.HasPrefix(lower, lowerQuery) {
            return 0.9
        }
        return 0.7
    }
    
    // Fuzzy match
    words := strings.Fields(lowerQuery)
    matches := 0
    for _, word := range words {
        if strings.Contains(lower, word) {
            matches++
        }
    }
    
    return float64(matches) / float64(len(words)) * 0.6
}
```

### Router Setup

```go
// router/router.go
api.GET("/search", handlers.SearchWorkspace)
api.GET("/search/suggestions", handlers.SearchSuggestions)
api.GET("/search/recent", handlers.GetRecentSearches)
api.POST("/search/history", handlers.SaveSearchHistory)
api.GET("/tables/:id/search", handlers.SearchTableRows)
api.GET("/forms/:id/search", handlers.SearchFormSubmissions)
```

## Testing

### Manual Testing Checklist

- [ ] Open search with `Cmd/Ctrl + K`
- [ ] Type query and see results update
- [ ] Navigate with arrow keys
- [ ] Select result with Enter
- [ ] Close with ESC
- [ ] Click recent searches
- [ ] Test empty state
- [ ] Test no results state
- [ ] Test secondary actions
- [ ] Test keyboard shortcuts
- [ ] Test on mobile (touch)

### Unit Tests Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { OmniSearch } from '@/components/OmniSearch'

describe('OmniSearch', () => {
  it('opens when isOpen is true', () => {
    render(<OmniSearch isOpen={true} onClose={() => {}} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
  
  it('calls onClose when ESC is pressed', () => {
    const onClose = jest.fn()
    render(<OmniSearch isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
```

## Performance Optimization

### Debouncing

Search queries are debounced by 150ms to avoid excessive API calls.

### Caching

Implement caching for:
- Recent searches (localStorage)
- Popular searches (5-minute cache)
- Search results (1-minute cache with query key)

### Lazy Loading

Results are paginated on the backend (max 50 per query) and can be loaded on scroll.

## Troubleshooting

### Search not working

1. Check API endpoint is accessible
2. Verify workspace ID is passed correctly
3. Check browser console for errors
4. Verify CORS settings allow frontend domain

### Keyboard shortcuts not working

1. Ensure `useOmniSearch` hook is used
2. Check for conflicting keyboard event handlers
3. Verify input is not focused when pressing shortcut

### Results not showing

1. Check API response format matches expected structure
2. Verify search permissions in backend
3. Check if results are filtered by workspace ID

## Future Enhancements

- [ ] Voice search
- [ ] Advanced filters (date range, created by, type)
- [ ] Search history analytics
- [ ] AI-powered search suggestions
- [ ] Fuzzy matching improvements
- [ ] Search within specific fields
- [ ] Bulk actions on search results
- [ ] Export search results
- [ ] Saved searches
- [ ] Search shortcuts (e.g., `@forms` to search only forms)

## Resources

- [Notion Command Menu](https://www.notion.so/help/keyboard-shortcuts)
- [Slack Search](https://slack.com/help/articles/202528808-Search-in-Slack)
- [Cmdk Library](https://github.com/pacocoursey/cmdk)
