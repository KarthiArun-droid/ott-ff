package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/netflix-ott/services/catalog-service/internal/config"
	"github.com/netflix-ott/services/catalog-service/internal/controller"
	"github.com/netflix-ott/services/catalog-service/internal/repository"
	"github.com/netflix-ott/services/catalog-service/internal/service"
)

func main() {
	log.Println("Starting Video Catalog Microservice...")

	cfg := config.LoadConfig()

	// Initialize MongoDB and Redis (Postgres removed, moved to Auth Service)
	mongoRepo, err := repository.NewMongoRepository(cfg)
	if err != nil {
		log.Fatalf("Fatal: MongoDB startup failed: %v", err)
	}

	redisCache := repository.NewRedisCache(cfg)

	catalogSvc := service.NewCatalogService(mongoRepo, redisCache, cfg)
	catalogCtrl := controller.NewCatalogController(catalogSvc, cfg)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Service specific paths (Pre-stripped of gateway versions prefix)
	v1 := router.Group("/videos")
	{
		v1.GET("/:id", catalogCtrl.GetVideoByID)
		v1.GET("/category/:category", catalogCtrl.GetVideosByCategory)
		v1.GET("/trending", catalogCtrl.GetTrendingVideos)
	}

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Printf("Catalog Service listing on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Listen error: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down catalog service...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Catalog service stopped.")
}
