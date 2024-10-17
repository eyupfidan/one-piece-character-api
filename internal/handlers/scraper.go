package handlers

import (
    "onepiece-scraper/internal/scraper"

    "github.com/gofiber/fiber/v2"
)

func ScrapeCharacters(c *fiber.Ctx) error {
    characters, err := scraper.ScrapeCharacters()
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(characters)
}