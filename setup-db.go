package main

import (
	"database/sql"
	"io/ioutil"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	log.Println("Connecting to default PostgreSQL database to manage schemas...")

	// 1. Connect to standard administrative postgres database using your credentials
	db, err := sql.Open("postgres", "postgres://postgres:12345678@localhost:5432/postgres?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to open connection to Postgres: %v", err)
	}
	defer db.Close()

	// 2. Create the target app database if not exists
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'ott_catalog')"
	err = db.QueryRow(query).Scan(&exists)
	if err != nil {
		log.Fatalf("Failed to check if DB exists: %v", err)
	}

	if !exists {
		_, err = db.Exec("CREATE DATABASE ott_catalog")
		if err != nil {
			log.Fatalf("Failed to create database 'ott_catalog': %v", err)
		}
		log.Println("Successfully created database 'ott_catalog'")
	} else {
		log.Println("Database 'ott_catalog' already exists")
	}

	// 3. Connect to the newly created database
	dbOtt, err := sql.Open("postgres", "postgres://postgres:12345678@localhost:5432/ott_catalog?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to open connection to 'ott_catalog': %v", err)
	}
	defer dbOtt.Close()

	// 4. Read migrations file
	migrationsBytes, err := ioutil.ReadFile("deployment/migrations.sql")
	if err != nil {
		log.Fatalf("Failed to read migrations.sql: %v", err)
	}

	// Execute migrations
	_, err = dbOtt.Exec(string(migrationsBytes))
	if err != nil {
		log.Fatalf("Failed to execute migrations DDL script: %v", err)
	}
	log.Println("Successfully executed SQL migrations schema")

	// 5. Seed test data
	seedQuery := `
		INSERT INTO videos (id, title, description, manifest_url, thumbnail_url)
		VALUES ('vid-999', 'Stranger Things Season 5', 'Adaptive transcode test', 'https://d111111abcdef8.cloudfront.net/vid-999/hls/vid-999_1080p.m3u8', 'https://thumb.url')
		ON CONFLICT (id) DO NOTHING;`
	_, err = dbOtt.Exec(seedQuery)
	if err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}
	log.Println("Successfully seeded test video 'vid-999' inside PostgreSQL")
}
