package router

import (
	"net/http"

	"github.com/Jsanchez767/matic-platform/config"
	"github.com/Jsanchez767/matic-platform/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	// Load HTML templates
	r.LoadHTMLGlob("templates/*")

	// Root route - API documentation (HTML)
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api-docs.html", nil)
	})

	// JSON API info endpoint
	r.GET("/api-info", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":     "Matic Platform API",
			"version":     "1.0.0",
			"status":      "running",
			"description": "Full-stack Airtable-like platform with forms and data tables",
			"endpoints": gin.H{
				"health":       "/health",
				"api_v1":       "/api/v1",
				"workspaces":   "/api/v1/workspaces",
				"tables":       "/api/v1/tables",
				"forms":        "/api/v1/forms",
				"request_hubs": "/api/v1/request-hubs",
			},
			"documentation": gin.H{
				"html": "/",
				"json": "/api/v1/docs",
				"health":  "/health",
			},
		})
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "matic-platform-go",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	api := r.Group("/api/v1")
	{
		// API v1 root endpoint - same as /docs
		api.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"api_version": "v1",
				"status":      "running",
				"service":     "Matic Platform API",
				"endpoints": gin.H{
					"workspaces": gin.H{
						"list":   "GET /api/v1/workspaces",
						"create": "POST /api/v1/workspaces",
						"get":    "GET /api/v1/workspaces/:id",
						"update": "PATCH /api/v1/workspaces/:id",
						"delete": "DELETE /api/v1/workspaces/:id",
					},
					"request_hubs": gin.H{
						"list":         "GET /api/v1/request-hubs",
						"create":       "POST /api/v1/request-hubs",
						"get":          "GET /api/v1/request-hubs/:hub_id",
						"get_by_slug":  "GET /api/v1/request-hubs/by-slug/:slug",
						"update":       "PATCH /api/v1/request-hubs/:hub_id",
						"delete":       "DELETE /api/v1/request-hubs/:hub_id",
						"list_tabs":    "GET /api/v1/request-hubs/:hub_id/tabs",
						"create_tab":   "POST /api/v1/request-hubs/:hub_id/tabs",
						"update_tab":   "PATCH /api/v1/request-hubs/:hub_id/tabs/:tab_id",
						"delete_tab":   "DELETE /api/v1/request-hubs/:hub_id/tabs/:tab_id",
						"reorder_tabs": "POST /api/v1/request-hubs/:hub_id/tabs/reorder",
					},
					"tables": gin.H{
						"list":        "GET /api/v1/tables",
						"create":      "POST /api/v1/tables",
						"get":         "GET /api/v1/tables/:id",
						"update":      "PATCH /api/v1/tables/:id",
						"delete":      "DELETE /api/v1/tables/:id",
						"list_rows":   "GET /api/v1/tables/:id/rows",
						"create_row":  "POST /api/v1/tables/:id/rows",
						"update_row":  "PATCH /api/v1/tables/:id/rows/:row_id",
						"delete_row":  "DELETE /api/v1/tables/:id/rows/:row_id",
					},
					"forms": gin.H{
						"list":              "GET /api/v1/forms",
						"create":            "POST /api/v1/forms",
						"get":               "GET /api/v1/forms/:id",
						"update":            "PATCH /api/v1/forms/:id",
						"delete":            "DELETE /api/v1/forms/:id",
						"list_submissions":  "GET /api/v1/forms/:id/submissions",
						"submit":            "POST /api/v1/forms/:id/submit",
					},
				},
			})
		})

		// API Documentation
		api.GET("/docs", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"api_version": "v1",
				"endpoints": gin.H{
					"workspaces": gin.H{
						"list":   "GET /api/v1/workspaces",
						"create": "POST /api/v1/workspaces",
						"get":    "GET /api/v1/workspaces/:id",
						"update": "PATCH /api/v1/workspaces/:id",
						"delete": "DELETE /api/v1/workspaces/:id",
					},
					"request_hubs": gin.H{
						"list":         "GET /api/v1/request-hubs",
						"create":       "POST /api/v1/request-hubs",
						"get":          "GET /api/v1/request-hubs/:hub_id",
						"get_by_slug":  "GET /api/v1/request-hubs/by-slug/:slug",
						"update":       "PATCH /api/v1/request-hubs/:hub_id",
						"delete":       "DELETE /api/v1/request-hubs/:hub_id",
						"list_tabs":    "GET /api/v1/request-hubs/:hub_id/tabs",
						"create_tab":   "POST /api/v1/request-hubs/:hub_id/tabs",
						"update_tab":   "PATCH /api/v1/request-hubs/:hub_id/tabs/:tab_id",
						"delete_tab":   "DELETE /api/v1/request-hubs/:hub_id/tabs/:tab_id",
						"reorder_tabs": "POST /api/v1/request-hubs/:hub_id/tabs/reorder",
					},
					"tables": gin.H{
						"list":        "GET /api/v1/tables",
						"create":      "POST /api/v1/tables",
						"get":         "GET /api/v1/tables/:id",
						"update":      "PATCH /api/v1/tables/:id",
						"delete":      "DELETE /api/v1/tables/:id",
						"list_rows":   "GET /api/v1/tables/:id/rows",
						"create_row":  "POST /api/v1/tables/:id/rows",
						"update_row":  "PATCH /api/v1/tables/:id/rows/:row_id",
						"delete_row":  "DELETE /api/v1/tables/:id/rows/:row_id",
						"search":      "GET /api/v1/tables/:id/search",
					},
					"forms": gin.H{
						"list":              "GET /api/v1/forms",
						"create":            "POST /api/v1/forms",
						"get":               "GET /api/v1/forms/:id",
						"update":            "PATCH /api/v1/forms/:id",
						"delete":            "DELETE /api/v1/forms/:id",
						"list_submissions":  "GET /api/v1/forms/:id/submissions",
						"submit":            "POST /api/v1/forms/:id/submit",
						"search":            "GET /api/v1/forms/:id/search",
					},
					"search": gin.H{
						"workspace":         "GET /api/v1/search?q=query&workspace_id=uuid",
						"suggestions":       "GET /api/v1/search/suggestions?q=query&workspace_id=uuid",
						"recent":            "GET /api/v1/search/recent?workspace_id=uuid&limit=10",
						"save_history":      "POST /api/v1/search/history",
						"popular":           "GET /api/v1/search/popular?workspace_id=uuid&limit=5",
						"clear_history":     "DELETE /api/v1/search/history/:workspace_id",
					},
				},
			})
		})

		// Workspaces
		workspaces := api.Group("/workspaces")
		{
			workspaces.GET("", handlers.ListWorkspaces)
			workspaces.POST("", handlers.CreateWorkspace)
			workspaces.GET("/:id", handlers.GetWorkspace)
			workspaces.PATCH("/:id", handlers.UpdateWorkspace)
			workspaces.DELETE("/:id", handlers.DeleteWorkspace)
		}

		// Request Hubs (separate base path to avoid conflicts with /workspaces/:id)
		reqHubs := api.Group("/request-hubs")
		{
			reqHubs.GET("", handlers.ListRequestHubs)               // ?workspace_id=xxx
			reqHubs.POST("", handlers.CreateRequestHub)             // workspace_id in body
			reqHubs.GET("/by-slug/:slug", handlers.GetRequestHubBySlug) // ?workspace_id=xxx
			reqHubs.GET("/:hub_id", handlers.GetRequestHub)
			reqHubs.PATCH("/:hub_id", handlers.UpdateRequestHub)
			reqHubs.DELETE("/:hub_id", handlers.DeleteRequestHub)

			// Request Hub Tabs
			reqHubs.GET("/:hub_id/tabs", handlers.ListRequestHubTabs)
			reqHubs.POST("/:hub_id/tabs", handlers.CreateRequestHubTab)
			reqHubs.PATCH("/:hub_id/tabs/:tab_id", handlers.UpdateRequestHubTab)
			reqHubs.DELETE("/:hub_id/tabs/:tab_id", handlers.DeleteRequestHubTab)
			reqHubs.POST("/:hub_id/tabs/reorder", handlers.ReorderRequestHubTabs)
		}

		// Data Tables
		tables := api.Group("/tables")
		{
			tables.GET("", handlers.ListDataTables)
			tables.POST("", handlers.CreateDataTable)
			tables.GET("/:id", handlers.GetDataTable)
			tables.PATCH("/:id", handlers.UpdateDataTable)
			tables.DELETE("/:id", handlers.DeleteDataTable)

			// Table rows
			tables.GET("/:id/rows", handlers.ListTableRows)
			tables.POST("/:id/rows", handlers.CreateTableRow)
			tables.PATCH("/:id/rows/:row_id", handlers.UpdateTableRow)
			tables.DELETE("/:id/rows/:row_id", handlers.DeleteTableRow)
			
			// Table search
			tables.GET("/:id/search", handlers.SearchTableRows)
		}

		// Forms
		forms := api.Group("/forms")
		{
			forms.GET("", handlers.ListForms)
			forms.POST("", handlers.CreateForm)
			forms.GET("/:id", handlers.GetForm)
			forms.PATCH("/:id", handlers.UpdateForm)
			forms.DELETE("/:id", handlers.DeleteForm)

			// Form submissions
			forms.GET("/:id/submissions", handlers.ListFormSubmissions)
			forms.POST("/:id/submit", handlers.SubmitForm)
			
			// Form search
			forms.GET("/:id/search", handlers.SearchFormSubmissions)
		}

		// Search
		search := api.Group("/search")
		{
			// Universal workspace search
			search.GET("", handlers.SearchWorkspace)
			
			// Search utilities
			search.GET("/suggestions", handlers.GetSearchSuggestions)
			search.GET("/recent", handlers.GetRecentSearches)
			search.POST("/history", handlers.SaveSearchHistory)
			search.GET("/popular", handlers.GetPopularSearches)
			search.DELETE("/history/:workspace_id", handlers.ClearSearchHistory)
		}

		// Add table search to tables group (need to modify tables section)
	}

	return r
}
