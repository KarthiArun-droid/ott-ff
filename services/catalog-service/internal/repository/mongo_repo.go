package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/netflix-ott/services/catalog-service/internal/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type Video struct {
	ID           string    `bson:"_id" json:"id"`
	Title        string    `bson:"title" json:"title"`
	Description  string    `bson:"description" json:"description"`
	ThumbnailURL string    `bson:"thumbnail_url" json:"thumbnail_url"`
	StreamURL    string    `bson:"stream_url" json:"stream_url"`
	Category     string    `bson:"category" json:"category"`
	Tags         []string  `bson:"tags" json:"tags"`
	ReleasedYear int       `bson:"released_year" json:"released_year"`
	CreatedAt    time.Time `bson:"created_at" json:"created_at"`
}

type MongoRepository interface {
	GetVideoByID(ctx context.Context, id string) (*Video, error)
	GetVideosByCategory(ctx context.Context, category string) ([]Video, error)
	GetTrendingVideos(ctx context.Context, limit int64) ([]Video, error)
}

type mongoRepo struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewMongoRepository(cfg *config.Config) (MongoRepository, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(cfg.MongoURI).
		SetReadPreference(readpref.SecondaryPreferred()).
		SetMaxPoolSize(100).
		SetMinPoolSize(10)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to mongodb: %w", err)
	}

	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return nil, fmt.Errorf("failed to ping mongodb: %w", err)
	}

	db := client.Database(cfg.MongoDBName)
	collection := db.Collection("videos")

	repo := &mongoRepo{
		db:         db,
		collection: collection,
	}

	if err := repo.createIndexes(); err != nil {
		return nil, fmt.Errorf("failed to build collection indexes: %w", err)
	}

	return repo, nil
}

func (r *mongoRepo) createIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModelCategory := mongo.IndexModel{
		Keys: bson.D{
			{Key: "category", Value: 1},
			{Key: "released_year", Value: -1},
		},
		Options: options.Index().SetName("idx_category_year"),
	}

	indexModelText := mongo.IndexModel{
		Keys: bson.D{
			{Key: "title", Value: "text"},
			{Key: "tags", Value: "text"},
		},
		Options: options.Index().SetName("idx_text_search"),
	}

	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		indexModelCategory,
		indexModelText,
	})
	return err
}

func (r *mongoRepo) GetVideoByID(ctx context.Context, id string) (*Video, error) {
	var video Video
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&video)
	if err != nil {
		return nil, err
	}
	return &video, nil
}

func (r *mongoRepo) GetVideosByCategory(ctx context.Context, category string) ([]Video, error) {
	filter := bson.M{"category": category}
	opts := options.Find().SetSort(bson.D{{Key: "released_year", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var videos []Video
	if err = cursor.All(ctx, &videos); err != nil {
		return nil, err
	}
	return videos, nil
}

func (r *mongoRepo) GetTrendingVideos(ctx context.Context, limit int64) ([]Video, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var videos []Video
	if err = cursor.All(ctx, &videos); err != nil {
		return nil, err
	}
	return videos, nil
}
