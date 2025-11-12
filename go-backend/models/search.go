package models

import (
	"time"

	"github.com/google/uuid"
)

// SearchHistory model for tracking user searches
type SearchHistory struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:uuid;not null;index" json:"workspace_id"`
	UserID      uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Query       string    `gorm:"type:varchar(500);not null" json:"query"`
	ResultCount int       `json:"result_count"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName specifies the table name for SearchHistory
func (SearchHistory) TableName() string {
	return "search_histories"
}
