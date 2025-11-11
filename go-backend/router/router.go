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

	// Load HTML templates
	r.LoadHTMLGlob("templates/*")

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	// API Documentation (root page)
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api_docs.html", nil)
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
		// API v1 root - redirect to docs
		api.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Matic Platform API v1",
				"documentation": "https://backend.maticslab.com/",
				"health": "https://backend.maticslab.com/health",
				"endpoints": gin.H{
					"workspaces": "/api/v1/workspaces",
					"request_hubs": "/api/v1/request-hubs",
					"tables": "/api/v1/tables",
					"forms": "/api/v1/forms",
				},
			})
		})
		api.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Matic Platform API v1",
				"documentation": "https://backend.maticslab.com/",
				"health": "https://backend.maticslab.com/health",
				"endpoints": gin.H{
					"workspaces": "/api/v1/workspaces",
					"request_hubs": "/api/v1/request-hubs",
					"tables": "/api/v1/tables",
					"forms": "/api/v1/forms",
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
		}
	}

	return r
}
