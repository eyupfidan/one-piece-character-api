package main

import (
    "log"
    "onepiece-scraper/internal/handlers"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
    app := fiber.New()

    // Logger middleware'i ekle
    app.Use(logger.New())

    app.Get("/scrape", handlers.ScrapeCharacters)

    log.Println("Server starting on http://localhost:3000")
    log.Fatal(app.Listen(":3000"))
}