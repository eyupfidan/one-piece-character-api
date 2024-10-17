package scraper

import (
    "onepiece-scraper/internal/models"
    "strings"
    "time"
    "log"

    "github.com/gocolly/colly/v2"
)

func ScrapeCharacters() ([]models.Character, error) {
    var characters []models.Character
    
    c := colly.NewCollector(
        colly.AllowedDomains("onepiece.fandom.com"),
        colly.UserAgent("OnePieceFanBot/1.0 (+https://google.com)"),
        colly.Async(true),
    )

    // Rate limiting: 5 saniyede 1 istek
    c.Limit(&colly.LimitRule{
        DomainGlob:  "*onepiece.fandom.com*",
        Parallelism: 1,
        RandomDelay: 5 * time.Second,
    })

    c.OnHTML("h2:first-of-type + table, h2:first-of-type + table + table", func(e *colly.HTMLElement) {
        e.ForEach("tbody tr td:nth-child(2) a", func(_ int, el *colly.HTMLElement) {
            c.Visit(e.Request.AbsoluteURL(el.Attr("href")))
        })
    })

    c.OnHTML("body", func(e *colly.HTMLElement) {
        character := models.Character{
            Name:     e.ChildText("aside .pi-item.pi-item-spacing.pi-title"),
            Sections: make(map[string]interface{}),
        }

        e.ForEach("aside .pi-item.pi-group", func(_ int, el *colly.HTMLElement) {
            sectionName := el.ChildText("h2")
            sectionData := make(map[string]string)

            el.ForEach(".pi-item.pi-data", func(_ int, item *colly.HTMLElement) {
                label := strings.TrimSpace(item.ChildText(".pi-data-label"))
                value := strings.TrimSpace(item.ChildText(".pi-data-value"))
                sectionData[label] = value
            })

            if len(sectionData) > 0 {
                character.Sections[sectionName] = sectionData
            }
        })

        if character.Name != "" {
            characters = append(characters, character)
        }
    })

    c.OnError(func(r *colly.Response, err error) {
        log.Printf("Request URL: %s failed with response: %v\nError: %v", r.Request.URL, r, err)
    })

    err := c.Visit("https://onepiece.fandom.com/wiki/List_of_Canon_Characters")
    if err != nil {
        return nil, err
    }

    c.Wait()

    return characters, nil
}