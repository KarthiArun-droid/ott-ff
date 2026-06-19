package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/netflix-ott/services/catalog-service/internal/config"
	"github.com/netflix-ott/services/catalog-service/internal/service"
)

type CatalogController struct {
	service    service.CatalogService
	cfg        *config.Config
	httpClient *http.Client
}

type AuthProfileResponse struct {
	ID                 string `json:"id"`
	UserID             string `json:"user_id"`
	ProfileName        string `json:"profile_name"`
	SubscriptionTier   string `json:"subscription_tier"`
	SubscriptionActive bool   `json:"subscription_active"`
}

func NewCatalogController(service service.CatalogService, cfg *config.Config) *CatalogController {
	return &CatalogController{
		service: service,
		cfg:     cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// verifySubscription asks the Auth Service over HTTP if user has active rights
func (ctrl *CatalogController) verifySubscription(userID string) (bool, error) {
	url := fmt.Sprintf("%s/auth/profile/%s", ctrl.cfg.AuthServiceURL, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("X-User-ID", userID)

	resp, err := ctrl.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("auth service unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, fmt.Errorf("user profile not found")
	} else if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("auth service error code: %d", resp.StatusCode)
	}

	var profile AuthProfileResponse
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return false, fmt.Errorf("invalid json payload from auth service: %w", err)
	}

	return profile.SubscriptionActive, nil
}

func (ctrl *CatalogController) GetVideoByID(c *gin.Context) {
	videoID := c.Param("id")
	userID := c.GetHeader("X-User-ID")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing subscriber identity header X-User-ID"})
		return
	}

	// 1. Validate subscription tier dynamically by querying Auth Service (Cross-Service boundary)
	isActive, err := ctrl.verifySubscription(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("Subscription verification failed: %v", err)})
		return
	}

	if !isActive {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": "Subscription expired or suspended"})
		return
	}

	// 2. Fetch catalog details
	video, err := ctrl.service.GetVideo(c.Request.Context(), videoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video metadata details not found"})
		return
	}

	c.JSON(http.StatusOK, video)
}

func (ctrl *CatalogController) GetTrendingVideos(c *gin.Context) {
	videos, err := ctrl.service.GetTrending(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load trending content"})
		return
	}
	c.JSON(http.StatusOK, videos)
}

func (ctrl *CatalogController) GetVideosByCategory(c *gin.Context) {
	category := c.Param("category")
	videos, err := ctrl.service.GetVideosByCategory(c.Request.Context(), category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search category"})
		return
	}
	c.JSON(http.StatusOK, videos)
}
