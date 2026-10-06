import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const outputDir = path.resolve("D:/ass_sd/work/live_screenshots");
fs.mkdirSync(outputDir, { recursive: true });

const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>Local screenshot capture</title>
<style>body{font-family:Arial,sans-serif;margin:40px}#drop{border:2px dashed #888;padding:40px;min-height:160px}#status{margin-top:20px;color:#14532d}</style>
</head><body><h1>Local screenshot capture</h1><div id="drop" contenteditable="true">Click here, then paste the browser screenshot with Ctrl+V.</div><div id="status"></div>
<script>
const name = new URLSearchParams(location.search).get('name') || 'capture.png';
const drop = document.getElementById('drop');
const status = document.getElementById('status');
drop.addEventListener('paste', async (event) => {
  const item = [...event.clipboardData.items].find((candidate) => candidate.type.startsWith('image/'));
  if (!item) { status.textContent = 'No image found in clipboard.'; return; }
  event.preventDefault();
  const blob = item.getAsFile();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const response = await fetch('/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, base64: btoa(binary) }) });
  const result = await response.json();
  status.textContent = result.ok ? 'Saved: ' + result.name : 'Save failed: ' + result.error;
});
</script></body></html>`;

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  if (request.method === "GET" && requestUrl.pathname === "/capture") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  if (request.method === "POST" && requestUrl.pathname === "/save") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const name = String(payload.name || "capture.png");
        if (!/^[A-Za-z0-9._-]+$/.test(name) || !name.toLowerCase().endsWith(".png")) throw new Error("invalid filename");
        const target = path.join(outputDir, name);
        fs.writeFileSync(target, Buffer.from(String(payload.base64), "base64"));
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true, name }));
      } catch (error) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
    return;
  }
  response.writeHead(404);
  response.end("Not found");
});

server.listen(8765, "127.0.0.1", () => {
  console.log(`Screenshot capture server listening on http://127.0.0.1:8765/capture`);
});
