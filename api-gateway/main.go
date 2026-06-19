package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

// Define local routing targets for our microservices
var (
	AuthServiceURL    = getEnv("AUTH_SERVICE_URL", "http://localhost:8081")
	CatalogServiceURL = getEnv("CATALOG_SERVICE_URL", "http://localhost:8082")
	StreamServiceURL  = getEnv("STREAM_SERVICE_URL", "http://localhost:8083")
)

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}

// Dynamic Reverse Proxy Router
func handleProxy(res http.ResponseWriter, req *http.Request) {
	// If it is an OPTIONS preflight request, respond immediately with CORS headers and 204 No Content
	if req.Method == http.MethodOptions {
		res.Header().Set("Access-Control-Allow-Origin", "*")
		res.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		res.WriteHeader(http.StatusNoContent)
		return
	}

	var targetURL string

	// Route traffic dynamically based on the URL path prefix
	switch {
	case strings.HasPrefix(req.URL.Path, "/api/v1/auth"):
		targetURL = AuthServiceURL
	case strings.HasPrefix(req.URL.Path, "/api/v1/catalog"):
		targetURL = CatalogServiceURL
	case strings.HasPrefix(req.URL.Path, "/api/v1/stream"):
		targetURL = StreamServiceURL
	default:
		http.Error(res, "Service Route Not Found", http.StatusNotFound)
		return
	}

	target, err := url.Parse(targetURL)
	if err != nil {
		log.Printf("Routing error structural destination: %v", err)
		http.Error(res, "Internal Gateway Error", http.StatusInternalServerError)
		return
	}

	// Create and serve the reverse proxy request
	proxy := httputil.NewSingleHostReverseProxy(target)

	// Ensure that CORS headers are preserved even after the reverse proxy returns
	proxy.ModifyResponse = func(r *http.Response) error {
		r.Header.Set("Access-Control-Allow-Origin", "*")
		r.Header.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		r.Header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		return nil
	}
	
	// Optional: Add global tracking headers for analytics downstream
	req.Header.Set("X-Gateway-Forwarded", "true")
	
	proxy.ServeHTTP(res, req)
}

func main() {
	http.HandleFunc("/", handleProxy)

	log.Println("OTT Edge API Gateway starting smoothly on port :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Gateway failure failed to initialize: %v", err)
	}
}
