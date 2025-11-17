package handlers

import (
	"net/http"

	"github.com/Jsanchez767/matic-platform/database"
	"github.com/Jsanchez767/matic-platform/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Request Hub Handlers

func ListRequestHubs(c *gin.Context) {
	workspaceID := c.Query("workspace_id")
	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace_id is required"})
		return
	}
	includeInactive := c.Query("include_inactive") == "true"

	var hubs []models.RequestHub
	query := database.DB.Where("workspace_id = ?", workspaceID)

	if !includeInactive {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("created_at DESC").Find(&hubs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hubs)
}

func GetRequestHub(c *gin.Context) {
	hubID := c.Param("hub_id")

	var hub models.RequestHub
	if err := database.DB.Preload("Tabs").
		Where("id = ?", hubID).
		First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	c.JSON(http.StatusOK, hub)
}

func GetRequestHubBySlug(c *gin.Context) {
	workspaceID := c.Query("workspace_id")
	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workspace_id is required"})
		return
	}
	slug := c.Param("slug")

	var hub models.RequestHub
	if err := database.DB.Preload("Tabs").
		Where("slug = ? AND workspace_id = ?", slug, workspaceID).
		First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	c.JSON(http.StatusOK, hub)
}

type CreateRequestHubInput struct {
	WorkspaceID uuid.UUID              `json:"workspace_id" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Slug        string                 `json:"slug" binding:"required"`
	Description string                 `json:"description"`
	Settings    map[string]interface{} `json:"settings"`
	IsActive    *bool                  `json:"is_active"`
}

func CreateRequestHub(c *gin.Context) {
	var input CreateRequestHubInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate slug
	var existing models.RequestHub
	if err := database.DB.Where("workspace_id = ? AND slug = ?", input.WorkspaceID, input.Slug).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Request hub with this slug already exists"})
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	hub := models.RequestHub{
		WorkspaceID: input.WorkspaceID,
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		Settings:    input.Settings,
		IsActive:    isActive,
		CreatedBy:   uuid.MustParse(c.Query("user_id")), // Get from auth middleware
	}

	if err := database.DB.Create(&hub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with tabs
	database.DB.Preload("Tabs").First(&hub, hub.ID)

	c.JSON(http.StatusCreated, hub)
}

type UpdateRequestHubInput struct {
	Name        *string                 `json:"name"`
	Slug        *string                 `json:"slug"`
	Description *string                 `json:"description"`
	Settings    *map[string]interface{} `json:"settings"`
	IsActive    *bool                   `json:"is_active"`
}

func UpdateRequestHub(c *gin.Context) {
	hubID := c.Param("hub_id")

	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var input UpdateRequestHubInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check slug conflicts if updating
	if input.Slug != nil && *input.Slug != hub.Slug {
		var existing models.RequestHub
		if err := database.DB.Where("workspace_id = ? AND slug = ? AND id != ?", hub.WorkspaceID, *input.Slug, hubID).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Request hub with this slug already exists"})
			return
		}
	}

	// Update fields
	if input.Name != nil {
		hub.Name = *input.Name
	}
	if input.Slug != nil {
		hub.Slug = *input.Slug
	}
	if input.Description != nil {
		hub.Description = *input.Description
	}
	if input.Settings != nil {
		hub.Settings = *input.Settings
	}
	if input.IsActive != nil {
		hub.IsActive = *input.IsActive
	}

	if err := database.DB.Save(&hub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with tabs
	database.DB.Preload("Tabs").First(&hub, hub.ID)

	c.JSON(http.StatusOK, hub)
}

func DeleteRequestHub(c *gin.Context) {
	hubID := c.Param("hub_id")

	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	if err := database.DB.Delete(&hub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// Request Hub Tab Handlers

func ListRequestHubTabs(c *gin.Context) {
	hubID := c.Param("hub_id")
	includeHidden := c.Query("include_hidden") == "true"

	// Verify hub exists
	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var tabs []models.RequestHubTab
	query := database.DB.Where("hub_id = ?", hubID)

	if !includeHidden {
		query = query.Where("is_visible = ?", true)
	}

	if err := query.Order("position ASC").Find(&tabs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tabs)
}

type CreateRequestHubTabInput struct {
	Name      string                 `json:"name" binding:"required"`
	Slug      string                 `json:"slug" binding:"required"`
	Type      string                 `json:"type" binding:"required"`
	Icon      string                 `json:"icon"`
	Position  int                    `json:"position"`
	IsVisible *bool                  `json:"is_visible"`
	Config    map[string]interface{} `json:"config"`
}

func CreateRequestHubTab(c *gin.Context) {
	hubID := c.Param("hub_id")

	// Verify hub exists
	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var input CreateRequestHubTabInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate slug
	var existing models.RequestHubTab
	if err := database.DB.Where("hub_id = ? AND slug = ?", hubID, input.Slug).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tab with this slug already exists"})
		return
	}

	isVisible := true
	if input.IsVisible != nil {
		isVisible = *input.IsVisible
	}

	tab := models.RequestHubTab{
		HubID:     uuid.MustParse(hubID),
		Name:      input.Name,
		Slug:      input.Slug,
		Type:      input.Type,
		Icon:      input.Icon,
		Position:  input.Position,
		IsVisible: isVisible,
		Config:    input.Config,
	}

	if err := database.DB.Create(&tab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tab)
}

type UpdateRequestHubTabInput struct {
	Name      *string                 `json:"name"`
	Slug      *string                 `json:"slug"`
	Type      *string                 `json:"type"`
	Icon      *string                 `json:"icon"`
	Position  *int                    `json:"position"`
	IsVisible *bool                   `json:"is_visible"`
	Config    *map[string]interface{} `json:"config"`
}

func UpdateRequestHubTab(c *gin.Context) {
	hubID := c.Param("hub_id")
	tabID := c.Param("tab_id")

	// Verify hub exists
	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var tab models.RequestHubTab
	if err := database.DB.Where("id = ? AND hub_id = ?", tabID, hubID).First(&tab).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var input UpdateRequestHubTabInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check slug conflicts if updating
	if input.Slug != nil && *input.Slug != tab.Slug {
		var existing models.RequestHubTab
		if err := database.DB.Where("hub_id = ? AND slug = ? AND id != ?", hubID, *input.Slug, tabID).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Tab with this slug already exists"})
			return
		}
	}

	// Update fields
	if input.Name != nil {
		tab.Name = *input.Name
	}
	if input.Slug != nil {
		tab.Slug = *input.Slug
	}
	if input.Type != nil {
		tab.Type = *input.Type
	}
	if input.Icon != nil {
		tab.Icon = *input.Icon
	}
	if input.Position != nil {
		tab.Position = *input.Position
	}
	if input.IsVisible != nil {
		tab.IsVisible = *input.IsVisible
	}
	if input.Config != nil {
		tab.Config = *input.Config
	}

	if err := database.DB.Save(&tab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tab)
}

func DeleteRequestHubTab(c *gin.Context) {
	hubID := c.Param("hub_id")
	tabID := c.Param("tab_id")

	// Verify hub exists
	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var tab models.RequestHubTab
	if err := database.DB.Where("id = ? AND hub_id = ?", tabID, hubID).First(&tab).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	if err := database.DB.Delete(&tab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

type ReorderTabInput struct {
	ID       uuid.UUID `json:"id" binding:"required"`
	Position int       `json:"position" binding:"required"`
}

type ReorderTabsInput struct {
	Tabs []ReorderTabInput `json:"tabs" binding:"required"`
}

func ReorderRequestHubTabs(c *gin.Context) {
	hubID := c.Param("hub_id")

	// Verify hub exists
	var hub models.RequestHub
	if err := database.DB.Where("id = ?", hubID).First(&hub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request hub not found"})
		return
	}

	var input ReorderTabsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update positions in transaction
	tx := database.DB.Begin()
	for _, item := range input.Tabs {
		if err := tx.Model(&models.RequestHubTab{}).
			Where("id = ? AND hub_id = ?", item.ID, hubID).
			Update("position", item.Position).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	tx.Commit()

	// Return updated tabs
	var tabs []models.RequestHubTab
	if err := database.DB.Where("hub_id = ?", hubID).Order("position ASC").Find(&tabs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tabs)
}
