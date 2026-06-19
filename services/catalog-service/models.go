package main

import "time"

type Video struct {
	ID          string    `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	ManifestURL string    `json:"manifest_url" db:"manifest_url"` // CloudFront HLS/DASH link
	Thumbnail   string    `json:"thumbnail_url" db:"thumbnail_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}
