import fs from "node:fs/promises";
import path from "node:path";
const manifest = JSON.parse(
  await fs.readFile("design/assets-manifest.json", "utf8"),
);
let invalid = 0;
for (const name of Object.keys(manifest).filter((n) => !n.includes("<"))) {
  const file = path.join("public/assets", name);
  try {
    if ((await fs.stat(file)).size === 0) throw new Error("empty");
  } catch {
    invalid++;
    console.error("Missing or empty:", file);
  }
}
if (invalid) process.exitCode = 1;
else console.log("All original design asset files are present and non-empty.");
