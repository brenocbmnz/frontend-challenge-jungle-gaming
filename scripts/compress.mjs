import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants } from "node:zlib";
const br = promisify(brotliCompress),
  gz = promisify(gzip);
// Keep the small stylesheet in the first HTML response to avoid a blocking RTT.
const htmlFile = path.join("dist", "index.html");
let html = await fs.readFile(htmlFile, "utf8");
for (const match of html.matchAll(
  /<link\b[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"\s]+\.css)"[^>]*>/g,
)) {
  const css = await fs.readFile(path.join("dist", match[1]), "utf8");
  html = html.replace(
    match[0],
    () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
  );
}
await fs.writeFile(htmlFile, html);
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(js|css|html|svg|json|txt)$/.test(file)) {
      const bytes = await fs.readFile(file);
      if (bytes.length < 512) continue;
      const [brotli, gzipped] = await Promise.all([
        br(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }),
        gz(bytes, { level: 9 }),
      ]);
      await Promise.all([
        fs.writeFile(file + ".br", brotli),
        fs.writeFile(file + ".gz", gzipped),
      ]);
    }
  }
}
await walk("dist");
console.log("Brotli and gzip variants generated for static text assets.");
