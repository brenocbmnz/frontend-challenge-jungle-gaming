import sharp from "sharp";
import fs from "node:fs/promises";
await fs.mkdir("public/fonts", { recursive: true });
await fs.copyFile(
  "node_modules/@fontsource-variable/roboto-mono/LICENSE",
  "public/fonts/LICENSE.txt",
);
await fs.copyFile(
  "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2",
  "public/fonts/roboto-mono-latin.woff2",
);
for (const name of ["8f387", "83794", "9add2", "b7cfc"])
  for (const width of [320, 480, 960]) {
    await sharp(`public/assets/${name}.png`)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 92, effort: 6 })
      .toFile(`public/assets/${name}-${width}.webp`);
  }
console.log("Responsive derivatives generated; original PNGs preserved.");
