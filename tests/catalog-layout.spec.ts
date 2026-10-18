import { test, expect } from "@playwright/test";
import { start } from "./helpers";

test("todos os cards mostram nome e preço sem sobrepor as linhas do catálogo", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 414, 683, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width <= 768) {
      const filter = page.getByRole("button", { name: "Filtros", exact: true });
      await expect(filter).toBeVisible();
      const centers = await filter.evaluate((button) => {
        const icon = button.querySelector("svg")!.getBoundingClientRect();
        const frame = button.getBoundingClientRect();
        return {
          x: Math.abs(
            icon.left + icon.width / 2 - frame.left - frame.width / 2,
          ),
          y: Math.abs(
            icon.top + icon.height / 2 - frame.top - frame.height / 2,
          ),
        };
      });
      expect(
        centers.x,
        `${width}px: ícone de filtros centralizado`,
      ).toBeLessThanOrEqual(1);
      expect(
        centers.y,
        `${width}px: ícone de filtros centralizado`,
      ).toBeLessThanOrEqual(1);
      const bannerArt = await page.locator(".hero img").evaluateAll(
        (images) =>
          images.filter((image) => {
            const bounds = image.getBoundingClientRect();
            return (
              bounds.width >= 40 &&
              bounds.height >= 40 &&
              getComputedStyle(image).visibility !== "hidden"
            );
          }).length,
      );
      expect(
        bannerArt,
        `${width}px: arte principal e miniatura da referência`,
      ).toBe(2);
      const hero = page.locator(".hero");
      const banner = (await hero.boundingBox())!;
      const action = (await hero
        .getByRole("link", { name: "EXPLORAR", exact: true })
        .boundingBox())!;
      expect(
        action.y + action.height,
        `${width}px: explorar dentro do banner`,
      ).toBeLessThan(banner.y + banner.height - 12);
      const main = (await hero.locator(".hero-art").boundingBox())!;
      const companion = (await hero.locator(".hero-companion").boundingBox())!;
      expect(companion.x).toBeGreaterThan(main.x);
      expect(companion.x + companion.width).toBeLessThan(main.x + main.width);
      expect(companion.y).toBeLessThan(main.y + main.height);
      expect(companion.y + companion.height).toBeGreaterThan(
        main.y + main.height,
      );
      const dots = (await hero.locator(".hero-mobile-dots").boundingBox())!;
      expect(
        Math.abs(dots.x + dots.width / 2 - banner.x - banner.width / 2),
      ).toBeLessThanOrEqual(1);
    }
    for (const number of [1, 4]) {
      await page.goto(number === 1 ? "/" : "/?page=4");
      await expect(
        page.locator(".nft-grid .nft-card > a").first(),
      ).toHaveAttribute(
        "href",
        `/nft/${(number - 1) * (width <= 768 ? 6 : 9) + 1}`,
      );
      await expect(page.locator(".nft-grid")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      const cards = page.locator(".nft-grid .nft-card");
      await expect(cards).toHaveCount(width <= 768 ? 6 : 9);
      for (const card of await cards.all()) {
        await expect(card.getByRole("heading")).toBeVisible();
        await expect(card.locator(".nft-price")).toBeVisible();
        await expect(card.locator(".nft-price")).toContainText("ETH");
      }
      const layout = await page.locator(".nft-grid").evaluate((grid) => {
        const rect = (element: Element) => {
          const { top, bottom, left, right } = element.getBoundingClientRect();
          return { top, bottom, left, right };
        };
        return {
          columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          cards: [...grid.querySelectorAll(".nft-card")].map((card) => {
            const price = card.querySelector(".nft-price")!;
            return {
              card: rect(card),
              art: rect(card.querySelector(".nft-art")!),
              heading: rect(card.querySelector("h3")!),
              price: rect(price),
              priceOverflow: price.scrollWidth - price.clientWidth,
            };
          }),
        };
      });
      for (let i = 0; i < layout.cards.length; i++) {
        const card = layout.cards[i];
        const context = `${width}px, página ${number}, card ${i + 1}`;
        expect(card.heading.top, context).toBeGreaterThanOrEqual(
          card.art.bottom - 1,
        );
        expect(card.price.top, context).toBeGreaterThanOrEqual(
          card.heading.bottom - 1,
        );
        expect(card.card.bottom, context).toBeGreaterThanOrEqual(
          card.price.bottom - 1,
        );
        expect(card.priceOverflow, context).toBeLessThanOrEqual(1);
        const rowStart = Math.floor(i / layout.columns) * layout.columns;
        expect(
          Math.abs(card.art.top - layout.cards[rowStart].art.top),
          context,
        ).toBeLessThanOrEqual(1);
        if (rowStart >= layout.columns) {
          const previousRow = layout.cards.slice(
            rowStart - layout.columns,
            rowStart,
          );
          expect(card.art.top, context).toBeGreaterThan(
            Math.max(...previousRow.map((item) => item.price.bottom)),
          );
        }
      }
    }
  }
});
