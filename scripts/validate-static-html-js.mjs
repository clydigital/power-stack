import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["index.html", "holdings.html", "watchlist.html", "themes.html", "capital-scarcity.html"];

let failures = 0;
for (const relative of targets) {
  const full = path.join(ROOT, relative);
  const html = fs.readFileSync(full, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!scripts.length) {
    console.log(`${relative}: no inline scripts.`);
    continue;
  }
  scripts.forEach((match, index) => {
    try {
      new Function(match[1]);
      console.log(`${relative}: inline script ${index + 1} syntax OK.`);
    } catch (error) {
      failures += 1;
      console.error(`${relative}: inline script ${index + 1} syntax FAILED.`);
      console.error(error);
    }
  });
}
if (failures) process.exitCode = 1;
