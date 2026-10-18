import sharp from "sharp";
import fs from "node:fs/promises";
await fs.mkdir("public/fonts", { recursive: true });
await fs.copyFile(
  "node_modules/@fontsource-variable/roboto-mono/LICENSE",
  "public/fonts/LICENSE.txt",
);
// The normalized font is versioned in public/fonts. Regenerate with:
// uv run scripts/prepare-font.py (see docs/FONTS.md).
for (const name of ["8f387", "83794", "9add2", "b7cfc"])
  for (const width of [64, 128, 192, 320, 384, 480, 640, 960]) {
    await sharp(`public/assets/${name}.png`)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, effort: 6 })
      .toFile(`public/assets/${name}-${width}.webp`);
  }
console.log("Responsive derivatives generated; original PNGs preserved.");
