package handlers

import (
	"net/http"

	"github.com/Jsanchez767/matic-platform/database"
	"github.com/Jsanchez767/matic-platform/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Data Table Handlers

func ListDataTables(c *gin.Context) {
	workspaceID := c.Query("workspace_id")

	var tables []models.DataTable
	query := database.DB

	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}

	if err := query.Preload("Columns").Order("created_at DESC").Find(&tables).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tables)
}

func GetDataTable(c *gin.Context) {
	id := c.Param("id")

	var table models.DataTable
	if err := database.DB.Preload("Columns").
		Preload("Views").
		First(&table, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data table not found"})
		return
	}

	c.JSON(http.StatusOK, table)
}

type CreateDataTableInput struct {
	WorkspaceID uuid.UUID              `json:"workspace_id" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	Icon        string                 `json:"icon"`
	Settings    map[string]interface{} `json:"settings"`
}

func CreateDataTable(c *gin.Context) {
	var input CreateDataTableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	icon := input.Icon
	if icon == "" {
		icon = "table"
	}

	table := models.DataTable{
		WorkspaceID: input.WorkspaceID,
		Name:        input.Name,
		Description: input.Description,
		Icon:        icon,
		Settings:    input.Settings,
	}

	if err := database.DB.Create(&table).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, table)
}

type UpdateDataTableInput struct {
	Name        *string                 `json:"name"`
	Description *string                 `json:"description"`
	Icon        *string                 `json:"icon"`
	Settings    *map[string]interface{} `json:"settings"`
}

func UpdateDataTable(c *gin.Context) {
	id := c.Param("id")

	var table models.DataTable
	if err := database.DB.First(&table, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data table not found"})
		return
	}

	var input UpdateDataTableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != nil {
		table.Name = *input.Name
	}
	if input.Description != nil {
		table.Description = *input.Description
	}
	if input.Icon != nil {
		table.Icon = *input.Icon
	}
	if input.Settings != nil {
		table.Settings = *input.Settings
	}

	if err := database.DB.Save(&table).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, table)
}

func DeleteDataTable(c *gin.Context) {
	id := c.Param("id")

	var table models.DataTable
	if err := database.DB.First(&table, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data table not found"})
		return
	}

	if err := database.DB.Delete(&table).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// Table Row Handlers

func ListTableRows(c *gin.Context) {
	tableID := c.Param("id")

	var rows []models.TableRow
	if err := database.DB.Where("table_id = ?", tableID).Order("position ASC").Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rows)
}

type CreateTableRowInput struct {
	Data     map[string]interface{} `json:"data" binding:"required"`
	Position int                    `json:"position"`
}

func CreateTableRow(c *gin.Context) {
	tableID := c.Param("id")

	var input CreateTableRowInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	row := models.TableRow{
		TableID:   uuid.MustParse(tableID),
		Data:      input.Data,
		Position:  input.Position,
		CreatedBy: uuid.MustParse(c.Query("user_id")),
	}

	if err := database.DB.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, row)
}

type UpdateTableRowInput struct {
	Data     *map[string]interface{} `json:"data"`
	Position *int                    `json:"position"`
}

func UpdateTableRow(c *gin.Context) {
	tableID := c.Param("id")
	rowID := c.Param("row_id")

	var row models.TableRow
	if err := database.DB.Where("id = ? AND table_id = ?", rowID, tableID).First(&row).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Row not found"})
		return
	}

	var input UpdateTableRowInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Data != nil {
		row.Data = *input.Data
	}
	if input.Position != nil {
		row.Position = *input.Position
	}

	if err := database.DB.Save(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, row)
}

func DeleteTableRow(c *gin.Context) {
	tableID := c.Param("id")
	rowID := c.Param("row_id")

	var row models.TableRow
	if err := database.DB.Where("id = ? AND table_id = ?", rowID, tableID).First(&row).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Row not found"})
		return
	}

	if err := database.DB.Delete(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
