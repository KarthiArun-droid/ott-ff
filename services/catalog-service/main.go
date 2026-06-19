package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type Env struct {
	repo *CatalogRepository
}

func main() {
	// Initialize connection pools from environment variables
	dbURI := os.Getenv("DB_URI")
	if dbURI == "" {
		dbURI = "postgres://user:password@localhost:5432/ott_catalog?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURI)
	if err != nil {
		log.Fatalf("PostgreSQL initialization crash: %v", err)
	}
	db.SetMaxOpenConns(25) // Prevent running out of connections under load

	redisURI := os.Getenv("REDIS_URI")
	if redisURI == "" {
		redisURI = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisURI,
	})

	env := &Env{
		repo: NewCatalogRepository(db, rdb),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/catalog/video", env.getVideoHandler)

	log.Println("Catalog Service streaming metadata on port :8082...")
	if err := http.ListenAndServe(":8082", mux); err != nil {
		log.Fatalf("Server failed to bind: %v", err)
	}
}

func (e *Env) getVideoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	videoID := r.URL.Query().Get("id")
	if videoID == "" {
		http.Error(w, "Missing query string tracking parameter 'id'", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	video, err := e.repo.GetVideoByID(ctx, videoID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(video)
}
