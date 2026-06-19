package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/netflix-ott/services/catalog-service/internal/config"
	"github.com/redis/go-redis/v9"
)

type RedisCache interface {
	GetVideo(ctx context.Context, id string) (*Video, error)
	SetVideo(ctx context.Context, video *Video, ttl time.Duration) error
	GetTrending(ctx context.Context) ([]Video, error)
	SetTrending(ctx context.Context, videos []Video, ttl time.Duration) error
	InvalidateVideo(ctx context.Context, id string) error
}

type redisCache struct {
	client *redis.Client
}

var ErrCacheMiss = errors.New("cache: key not found")

func NewRedisCache(cfg *config.Config) RedisCache {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
		PoolSize: 100,
	})

	return &redisCache{client: client}
}

func (c *redisCache) GetVideo(ctx context.Context, id string) (*Video, error) {
	key := "video:" + id
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	} else if err != nil {
		return nil, err
	}

	var video Video
	if err := json.Unmarshal([]byte(val), &video); err != nil {
		return nil, err
	}
	return &video, nil
}

func (c *redisCache) SetVideo(ctx context.Context, video *Video, ttl time.Duration) error {
	key := "video:" + video.ID
	data, err := json.Marshal(video)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, data, ttl).Err()
}

func (c *redisCache) GetTrending(ctx context.Context) ([]Video, error) {
	key := "videos:trending"
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	} else if err != nil {
		return nil, err
	}

	var videos []Video
	if err := json.Unmarshal([]byte(val), &videos); err != nil {
		return nil, err
	}
	return videos, nil
}

func (c *redisCache) SetTrending(ctx context.Context, videos []Video, ttl time.Duration) error {
	key := "videos:trending"
	data, err := json.Marshal(videos)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, data, ttl).Err()
}

func (c *redisCache) InvalidateVideo(ctx context.Context, id string) error {
	key := "video:" + id
	return c.client.Del(ctx, key).Err()
}
