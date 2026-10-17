import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const args = process.argv.slice(2);
const port = Number(args[args.indexOf("--port") + 1]) || 4173;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let file = path.resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    let stat = await fs.stat(file).catch(() => undefined);
    if (stat?.isDirectory()) {
      file = path.join(file, "index.html");
      stat = await fs.stat(file).catch(() => undefined);
    }
    if (!stat) {
      if (path.extname(pathname)) {
        response.writeHead(404).end("Not found");
        return;
      }
      file = path.join(root, "index.html");
      stat = await fs.stat(file);
    }
    const extension = path.extname(file);
    const headers = {
      "Content-Type": mime[extension] || "application/octet-stream",
      Vary: "Accept-Encoding",
      "Cache-Control":
        extension === ".html" ||
        file.endsWith("mockServiceWorker.js") ||
        file.endsWith("apiMockServiceWorker.js")
          ? "no-cache"
          : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    };
    const encoding = request.headers["accept-encoding"] || "";
    for (const [type, suffix] of [
      ["br", ".br"],
      ["gzip", ".gz"],
    ])
      if (
        encoding.includes(type) &&
        (await fs.stat(file + suffix).catch(() => undefined))
      ) {
        file += suffix;
        headers["Content-Encoding"] = type;
        break;
      }
    const bytes = await fs.readFile(file);
    headers["Content-Length"] = String(bytes.length);
    response.writeHead(200, headers);
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(500).end("Unable to serve build");
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`Local: http://localhost:${port}/`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => server.close(() => process.exit(0)));
