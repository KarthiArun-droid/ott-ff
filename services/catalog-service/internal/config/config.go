package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port           string
	MongoURI       string
	MongoDBName    string
	RedisAddr      string
	RedisPass      string
	AuthServiceURL string
	CacheTTL       time.Duration
}

func LoadConfig() *Config {
	return &Config{
		Port:           getEnv("PORT", "8082"),
		MongoURI:       getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDBName:    getEnv("MONGO_DB_NAME", "ott_catalog"),
		RedisAddr:      getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPass:      getEnv("REDIS_PASSWORD", ""),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://auth-service:8081"),
		CacheTTL:       time.Duration(getIntEnv("CACHE_TTL_MINUTES", 15)) * time.Minute,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}

func getIntEnv(key string, defaultVal int) int {
	valStr, ok := os.LookupEnv(key)
	if !ok {
		return defaultVal
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return defaultVal
	}
	return val
}
