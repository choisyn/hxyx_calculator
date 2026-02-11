package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
}

type ServerConfig struct {
	Addr string `yaml:"addr"`
}

type DatabaseConfig struct {
	Host       string `yaml:"host"`
	Port       int    `yaml:"port"`
	Name       string `yaml:"name"`
	User       string `yaml:"user"`
	Password   string `yaml:"password"`
	Parameters string `yaml:"parameters"`
}

type PlanInput struct {
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	ResultMode   string          `json:"result_mode"`
	Items        json.RawMessage `json:"items"`
	BigResult    json.RawMessage `json:"big_result"`
	SmallResult  json.RawMessage `json:"small_result"`
	StaminaBig   int             `json:"stamina_big"`
	StaminaSmall int             `json:"stamina_small"`
}

type Plan struct {
	ID           int64           `json:"id"`
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	ResultMode   string          `json:"result_mode"`
	Items        json.RawMessage `json:"items"`
	BigResult    json.RawMessage `json:"big_result,omitempty"`
	SmallResult  json.RawMessage `json:"small_result,omitempty"`
	StaminaBig   int             `json:"stamina_big"`
	StaminaSmall int             `json:"stamina_small"`
	CreatedAt    time.Time       `json:"created_at"`
}

type apiServer struct {
	db *sql.DB
}

func defaultConfig() Config {
	return Config{
		Server: ServerConfig{
			Addr: ":8080",
		},
		Database: DatabaseConfig{
			Host:       "127.0.0.1",
			Port:       3306,
			Parameters: "charset=utf8mb4&parseTime=true&loc=Local",
		},
	}
}

func loadConfig(path string) (Config, error) {
	cfg := defaultConfig()
	data, err := os.ReadFile(path)
	if err != nil {
		return cfg, err
	}
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, err
	}
	if cfg.Server.Addr == "" {
		cfg.Server.Addr = ":8080"
	}
	if cfg.Database.Host == "" {
		cfg.Database.Host = "127.0.0.1"
	}
	if cfg.Database.Port == 0 {
		cfg.Database.Port = 3306
	}
	if cfg.Database.Parameters == "" {
		cfg.Database.Parameters = "charset=utf8mb4&parseTime=true&loc=Local"
	}
	return cfg, nil
}

func buildDSN(cfg Config) (string, error) {
	if strings.TrimSpace(cfg.Database.Name) == "" {
		return "", errors.New("database.name is required")
	}
	if strings.TrimSpace(cfg.Database.User) == "" {
		return "", errors.New("database.user is required")
	}
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.Parameters,
	), nil
}

func (s *apiServer) handlePlans(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listPlans(w, r)
	case http.MethodPost:
		s.createPlan(w, r)
	case http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *apiServer) listPlans(w http.ResponseWriter, _ *http.Request) {
	rows, err := s.db.Query(`
		SELECT id, title, description, result_mode, items_json, big_result_json, small_result_json,
		       stamina_big, stamina_small, created_at
		FROM plan_market
		ORDER BY created_at DESC
		LIMIT 100`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	plans := make([]Plan, 0)
	for rows.Next() {
		var plan Plan
		var itemsStr sql.NullString
		var bigStr sql.NullString
		var smallStr sql.NullString
		if err := rows.Scan(
			&plan.ID,
			&plan.Title,
			&plan.Description,
			&plan.ResultMode,
			&itemsStr,
			&bigStr,
			&smallStr,
			&plan.StaminaBig,
			&plan.StaminaSmall,
			&plan.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}

		plan.Items = toRawJSON(itemsStr)
		plan.BigResult = toRawJSON(bigStr)
		plan.SmallResult = toRawJSON(smallStr)
		plans = append(plans, plan)
	}

	writeJSON(w, http.StatusOK, map[string]any{"plans": plans})
}

func (s *apiServer) createPlan(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	var input PlanInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := validatePlanInput(input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := s.db.Exec(`
		INSERT INTO plan_market
			(title, description, result_mode, items_json, big_result_json, small_result_json, stamina_big, stamina_small)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		input.Title,
		input.Description,
		input.ResultMode,
		string(input.Items),
		nullableJSON(input.BigResult),
		nullableJSON(input.SmallResult),
		input.StaminaBig,
		input.StaminaSmall,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert failed")
		return
	}
	id, _ := result.LastInsertId()

	writeJSON(w, http.StatusCreated, map[string]any{
		"id": id,
	})
}

func validatePlanInput(input PlanInput) error {
	if strings.TrimSpace(input.Title) == "" {
		return errors.New("title is required")
	}
	switch input.ResultMode {
	case "big", "small", "both":
	default:
		return errors.New("result_mode must be big, small, or both")
	}

	if isEmptyJSON(input.Items) {
		return errors.New("items is required")
	}
	if input.ResultMode == "big" && isEmptyJSON(input.BigResult) {
		return errors.New("big_result is required for result_mode=big")
	}
	if input.ResultMode == "small" && isEmptyJSON(input.SmallResult) {
		return errors.New("small_result is required for result_mode=small")
	}
	if input.ResultMode == "both" && (isEmptyJSON(input.BigResult) || isEmptyJSON(input.SmallResult)) {
		return errors.New("big_result and small_result are required for result_mode=both")
	}
	return nil
}

func isEmptyJSON(raw json.RawMessage) bool {
	trimmed := bytes.TrimSpace(raw)
	return len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null"))
}

func nullableJSON(raw json.RawMessage) any {
	if isEmptyJSON(raw) {
		return nil
	}
	return string(raw)
}

func toRawJSON(val sql.NullString) json.RawMessage {
	if !val.Valid {
		return nil
	}
	trimmed := strings.TrimSpace(val.String)
	if trimmed == "" {
		return nil
	}
	return json.RawMessage(trimmed)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func ensureSchema(db *sql.DB) error {
	schema := `
		CREATE TABLE IF NOT EXISTS plan_market (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(120) NOT NULL,
			description TEXT,
			result_mode VARCHAR(10) NOT NULL,
			items_json LONGTEXT NOT NULL,
			big_result_json LONGTEXT,
			small_result_json LONGTEXT,
			stamina_big INT NOT NULL DEFAULT 0,
			stamina_small INT NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
	_, err := db.Exec(schema)
	return err
}

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}
	cfg, err := loadConfig(configPath)
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}
	dsn, err := buildDSN(cfg)
	if err != nil {
		log.Fatalf("invalid config: %v", err)
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("db open failed: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("db ping failed: %v", err)
	}
	if err := ensureSchema(db); err != nil {
		log.Fatalf("schema init failed: %v", err)
	}

	mux := http.NewServeMux()
	server := &apiServer{db: db}
	mux.HandleFunc("/api/plans", server.handlePlans)
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	log.Printf("api listening on %s", cfg.Server.Addr)
	if err := http.ListenAndServe(cfg.Server.Addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}
