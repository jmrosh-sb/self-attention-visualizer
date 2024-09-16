package main

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "strings"
    "strconv"

    "github.com/gorilla/mux"
    "github.com/rs/cors"
    _ "github.com/mattn/go-sqlite3"
)

type TextData struct {
    ID   int    `json:"id"`
    Text string `json:"text"`
}

var db *sql.DB

func main() {
    var err error
    db, err = sql.Open("sqlite3", "./textdata.db")
    if err != nil {
        panic(err)
    }
    defer db.Close()

    createTable()

    router := mux.NewRouter()

    router.HandleFunc("/api/texts", getTexts).Methods("GET")
    router.HandleFunc("/api/texts/{id}", getText).Methods("GET")
    router.HandleFunc("/api/texts", createText).Methods("POST")
    router.HandleFunc("/api/texts/{id}", updateText).Methods("PUT")
    router.HandleFunc("/api/texts/{id}", deleteText).Methods("DELETE")
    router.HandleFunc("/api/visualize", visualizeText).Methods("POST")

    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"*"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"*"},
        AllowCredentials: true,
    })

    handler := c.Handler(router)

    http.ListenAndServe(":8080", handler)
}

func createTable() {
    sqlStmt := `
    CREATE TABLE IF NOT EXISTS texts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL
    );
    `
    _, err := db.Exec(sqlStmt)
    if err != nil {
        panic(err)
    }
}

// Handler functions (getTexts, getText, createText, updateText, deleteText, visualizeText) go here...

func getTexts(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT id, text FROM texts")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var texts []TextData
    for rows.Next() {
        var text TextData
        err := rows.Scan(&text.ID, &text.Text)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        texts = append(texts, text)
    }
    json.NewEncoder(w).Encode(texts)
}

func getText(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id := params["id"]
    var text TextData
    err := db.QueryRow("SELECT id, text FROM texts WHERE id = ?", id).Scan(&text.ID, &text.Text)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }
    json.NewEncoder(w).Encode(text)
}

func createText(w http.ResponseWriter, r *http.Request) {
    var text TextData
    json.NewDecoder(r.Body).Decode(&text)
    if len(text.Text) > 100 {
        http.Error(w, "Text exceeds 100 characters", http.StatusBadRequest)
        return
    }
    res, err := db.Exec("INSERT INTO texts(text) VALUES(?)", text.Text)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    id, _ := res.LastInsertId()
    text.ID = int(id)
    json.NewEncoder(w).Encode(text)
}

func updateText(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id := params["id"]
    var text TextData
    json.NewDecoder(r.Body).Decode(&text)
    if len(text.Text) > 100 {
        http.Error(w, "Text exceeds 100 characters", http.StatusBadRequest)
        return
    }
    _, err := db.Exec("UPDATE texts SET text = ? WHERE id = ?", text.Text, id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    text.ID, _ = strconv.Atoi(id)
    json.NewEncoder(w).Encode(text)
}

func deleteText(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id := params["id"]
    _, err := db.Exec("DELETE FROM texts WHERE id = ?", id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

func visualizeText(w http.ResponseWriter, r *http.Request) {
    type VisualizeRequest struct {
        Text string `json:"text"`
    }
    var req VisualizeRequest
    json.NewDecoder(r.Body).Decode(&req)
    tokens := tokenize(req.Text)
    attentionScores := computeAttention(tokens)
    json.NewEncoder(w).Encode(attentionScores)
}

// Helper functions (tokenize, computeAttention) go here...
func tokenize(text string) []string {
    // Simple whitespace tokenizer
    return strings.Fields(text)
}

func computeAttention(tokens []string) [][]float64 {
    n := len(tokens)
    attention := make([][]float64, n)
    for i := 0; i < n; i++ {
        attention[i] = make([]float64, n)
        for j := 0; j < n; j++ {
            if i == j {
                attention[i][j] = 1.0
            } else {
                attention[i][j] = 0.5 // Dummy value for demonstration
            }
        }
    }
    return attention
}

