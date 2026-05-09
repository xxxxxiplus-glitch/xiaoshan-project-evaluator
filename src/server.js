import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(rootDir, "docs");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function resolvePublicPath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const decoded = decodeURIComponent(cleanPath.split("?")[0]);
  const normalized = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(publicDir, normalized);
}

createServer(async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const filePath = resolvePublicPath(request.url || "/");
    const ext = extname(filePath);
    const body = await readFile(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
}).listen(port, () => {
  console.log(`Project evaluator running at http://127.0.0.1:${port}`);
});
