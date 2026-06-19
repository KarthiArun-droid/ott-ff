package service

import (
	"context"
	"errors"
	"math/rand"
	"time"

	"github.com/netflix-ott/services/catalog-service/internal/config"
	"github.com/netflix-ott/services/catalog-service/internal/repository"
)

type CatalogService interface {
	GetVideo(ctx context.Context, id string) (*repository.Video, error)
	GetTrending(ctx context.Context) ([]repository.Video, error)
	GetVideosByCategory(ctx context.Context, category string) ([]repository.Video, error)
}

type catalogService struct {
	mongoRepo  repository.MongoRepository
	redisCache repository.RedisCache
	cfg        *config.Config
}

func NewCatalogService(
	mongoRepo repository.MongoRepository,
	redisCache repository.RedisCache,
	cfg *config.Config,
) CatalogService {
	return &catalogService{
		mongoRepo:  mongoRepo,
		redisCache: redisCache,
		cfg:        cfg,
	}
}

func (s *catalogService) GetVideo(ctx context.Context, id string) (*repository.Video, error) {
	video, err := s.redisCache.GetVideo(ctx, id)
	if err == nil {
		return video, nil
	}

	if !errors.Is(err, repository.ErrCacheMiss) {
		println("Redis cache warning:", err.Error())
	}

	video, err = s.mongoRepo.GetVideoByID(ctx, id)
	if err != nil {
		return nil, err
	}

	jitter := time.Duration(rand.Intn(180)) * time.Second
	ttl := s.cfg.CacheTTL + jitter
	_ = s.redisCache.SetVideo(ctx, video, ttl)

	return video, nil
}

func (s *catalogService) GetTrending(ctx context.Context) ([]repository.Video, error) {
	videos, err := s.redisCache.GetTrending(ctx)
	if err == nil {
		return videos, nil
	}

	videos, err = s.mongoRepo.GetTrendingVideos(ctx, 20)
	if err != nil {
		return nil, err
	}

	jitter := time.Duration(rand.Intn(60)) * time.Second
	ttl := s.cfg.CacheTTL + jitter
	_ = s.redisCache.SetTrending(ctx, videos, ttl)

	return videos, nil
}

func (s *catalogService) GetVideosByCategory(ctx context.Context, category string) ([]repository.Video, error) {
	return s.mongoRepo.GetVideosByCategory(ctx, category)
}
