# OTT Video Streaming Platform Microservices

This repository contains the microservice implementation and infrastructure setup for a highly scalable OTT video streaming platform (similar to Netflix), organized into decoupled service domains.

---

## Repository Structure

```
ott-streaming-platform/
├── api-gateway/          # Reverse proxy & Central entry point
│   ├── main.go           # Proxy rules mapping paths to microservices
│   └── Dockerfile        # Gateway container build config
├── services/             # Core Microservices
│   ├── auth-service/     # Handles subscribers billing tiers (PostgreSQL)
│   ├── catalog-service/  # Video metadata and search caching (MongoDB + Redis)
│   └── streaming-service/# Computes HMAC-SHA256 signed playback manifest links
├── deployment/           # Local docker environment definition
│   ├── docker-compose.yml# Orchestrator combining Gateway, services, and DBs
│   └── init-db.sql       # Seed profiles table schema into PostgreSQL on boot
└── README.md             # Setup and execution documentation
```

---

## Microservice Routing Table

The central **API Gateway** listens on port **`8000`** and distributes paths:

| Public Endpoint Path | Target Service | Purpose |
| :--- | :--- | :--- |
| `GET /api/v1/auth/profile/:user_id` | `auth-service` (Port 8081) | Inspect subscriber status |
| `GET /api/v1/videos/:id` | `catalog-service` (Port 8082)| Query metadata details (Cache-Aside) |
| `GET /api/v1/videos/trending` | `catalog-service` (Port 8082)| Get trending movies listing |
| `GET /api/v1/stream/url/:video_id` | `streaming-service` (Port 8083)| Obtain signed CDN playback manifest |

---

## Local Development Execution

### Prerequisites
* [Docker](https://www.docker.com/) and Docker Compose installed.

### Setup and Start
Navigate to the `deployment` directory and initiate compose building processes:

```bash
cd deployment
docker-compose up --build
```

Docker will automatically:
1. Initialize the PostgreSQL container and execute `init-db.sql` schema structures.
2. Initialize MongoDB and Redis instances.
3. Build the Go source executables and spin up the gateway and microservices.

---

## Testing API Integrations

The seed script registers two test profiles:
1. `user-123`: Active Subscription (`subscription_active = true`)
2. `user-abc`: Inactive Subscription (`subscription_active = false`)

### 1. Retrieve Auth profiles (Auth Service via Proxy)
```bash
curl -X GET http://localhost:8000/api/v1/auth/profile/user-123
```
*Response*:
```json
{
  "id": "prof-100",
  "user_id": "user-123",
  "profile_name": "John Doe Active",
  "subscription_tier": "Premium UHD",
  "subscription_active": true
}
```

### 2. Fetch Catalog Details for Active Subscriber
Pass `X-User-ID: user-123` to authorize lookups:
```bash
curl -X GET http://localhost:8000/api/v1/videos/movie-999 \
  -H "X-User-ID: user-123"
```
*Response*:
Returns the metadata document. (Queries MongoDB on cache-miss; caches JSON to Redis for successive sub-millisecond calls).

### 3. Fetch Catalog Details for Inactive Subscriber
```bash
curl -X GET http://localhost:8000/api/v1/videos/movie-999 \
  -H "X-User-ID: user-abc"
```
*Response*:
```json
{
  "error": "Subscription expired or suspended"
}
```

### 4. Fetch Signed CDN Playback URLs
```bash
curl -X GET http://localhost:8000/api/v1/stream/url/movie-999 \
  -H "X-User-ID: user-123"
```
*Response*:
```json
{
  "video_id": "movie-999",
  "signed_url": "https://d111111abcdef8.cloudfront.net/movie-999/hls/movie-999_1080p.m3u8?exp=1781845111&sig=c56b7cd5a...",
  "expires_at": 1781845111
}
```
*Note: The generated `sig` parameter is validated at the CDN edge by our Lambda@Edge cryptographic script to protect video assets from unauthorized hotlinking.*
