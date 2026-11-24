// Local stand-in for Cloudflare R2 used only by the e2e tests (started from playwright.config.ts).
// It enforces what the real bucket enforces for our uploads: CORS for the browser PUT and the
// SHA-256 checksum header, and it reports the checksum back on HEAD like R2 does.
import { createHash } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.FAKE_R2_PORT ?? 3199);
const objects = new Map();

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, PUT, HEAD, DELETE",
  "access-control-allow-headers": "content-type, x-amz-checksum-sha256",
};

createServer((req, res) => {
  const key = decodeURIComponent(new URL(req.url, "http://localhost").pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors).end();
    return;
  }

  if (req.method === "PUT") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const checksum = createHash("sha256").update(body).digest("base64");
      if (req.headers["x-amz-checksum-sha256"] !== checksum) {
        res.writeHead(400, cors).end("BadDigest");
        return;
      }
      objects.set(key, { body, contentType: req.headers["content-type"], checksum });
      res.writeHead(200, cors).end();
    });
    return;
  }

  const object = objects.get(key);
  if (req.method === "DELETE") {
    objects.delete(key);
    res.writeHead(204, cors).end();
    return;
  }
  if (!object) {
    res.writeHead(404, cors).end();
    return;
  }
  const headers = {
    ...cors,
    "content-type": object.contentType,
    "content-length": String(object.body.length),
    "x-amz-checksum-sha256": object.checksum,
  };
  if (req.method === "HEAD") res.writeHead(200, headers).end();
  else res.writeHead(200, headers).end(object.body);
}).listen(port, () => console.log(`fake R2 listening on ${port}`));
