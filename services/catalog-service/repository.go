package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

type CatalogRepository struct {
	DB    *sql.DB
	Cache *redis.Client
}

func NewCatalogRepository(db *sql.DB, cache *redis.Client) *CatalogRepository {
	return &CatalogRepository{DB: db, Cache: cache}
}

func (r *CatalogRepository) GetVideoByID(ctx context.Context, id string) (*Video, error) {
	cacheKey := "video:" + id

	// 1. Try to fetch from Redis Cache
	cachedData, err := r.Cache.Get(ctx, cacheKey).Result()
	if err == nil {
		var video Video
		if err := json.Unmarshal([]byte(cachedData), &video); err == nil {
			return &video, nil
		}
	}

	// 2. Cache Miss - Query the SQL Database
	query := `SELECT id, title, description, manifest_url, thumbnail_url, created_at FROM videos WHERE id = $1`
	var video Video
	err = r.DB.QueryRowContext(ctx, query, id).Scan(
		&video.ID, &video.Title, &video.Description, &video.ManifestURL, &video.Thumbnail, &video.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("video not found")
		}
		return nil, err
	}

	// 3. Save back to Redis with an expiration window (e.g., 15 minutes)
	if serialized, err := json.Marshal(video); err == nil {
		_ = r.Cache.Set(ctx, cacheKey, serialized, 15*time.Minute).Err()
	}

	return &video, nil
}
