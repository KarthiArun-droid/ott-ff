package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("your_production_secret_key_dont_leak_this")

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Claims struct {
	UserID string `json:"user_id"`
	jwt.MapClaims
}

type AuthService struct {
	DB *sql.DB
}

func (s *AuthService) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	_, err = s.DB.Exec("INSERT INTO users (id, email, password_hash, created_at) VALUES (gen_random_uuid(), $1, $2, $3)", 
		creds.Email, string(hashedPassword), time.Now())
	if err != nil {
		http.Error(w, "User registration failed or email exists", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (s *AuthService) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid structural input", http.StatusBadRequest)
		return
	}

	var userID, storedHash string
	err := s.DB.QueryRow("SELECT id, password_hash FROM users WHERE email = $1", creds.Email).Scan(&userID, &storedHash)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(creds.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     expirationTime.Unix(),
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Token generation failure", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

func main() {
	dbURI := os.Getenv("DB_URI")
	if dbURI == "" {
		dbURI = "postgres://user:password@localhost:5432/ott_catalog?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURI)
	if err != nil {
		log.Fatalf("Auth DB crash connection error: %v", err)
	}

	authService := &AuthService{DB: db}

	http.HandleFunc("/api/v1/auth/register", authService.RegisterHandler)
	http.HandleFunc("/api/v1/auth/login", authService.LoginHandler)

	log.Println("Auth Service validating claims on port :8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
