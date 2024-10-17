package models

type Character struct {
    Name     string                 `json:"name"`
    Sections map[string]interface{} `json:"sections"`
}