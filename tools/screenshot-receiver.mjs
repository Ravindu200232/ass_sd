import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = 'D:\\ass_sd\\video\\Ravindu';
const folders = {
  V01: 'Vulnerability 01 - Public Registration',
  V02: 'Vulnerability 02 - Missing Role Authorization',
  V03: 'Vulnerability 03 - Cross Branch IDOR',
  V05: 'Vulnerability 05 - Authentication Weaknesses',
  V06: 'Vulnerability 06 - Token Lifecycle',
};

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1:8765');
  if (req.method === 'GET' && url.pathname === '/evidence') {
    const title = escapeHtml(url.searchParams.get('title') ?? 'Code evidence');
    const source = escapeHtml(url.searchParams.get('source') ?? '');
    const code = escapeHtml(url.searchParams.get('code') ?? '');
    const note = escapeHtml(url.searchParams.get('note') ?? '');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#0b1220;color:#e5e7eb;font-family:Segoe UI,Arial,sans-serif}
      .wrap{padding:28px 36px}h1{font-size:25px;margin:0 0 8px;color:#93c5fd}
      h2{font-size:14px;font-weight:400;color:#cbd5e1;margin:0 0 18px}
      pre{margin:0;padding:22px;background:#111827;border:1px solid #334155;border-radius:10px;color:#e2e8f0;font:15px/1.48 Consolas,monospace;white-space:pre-wrap;overflow:hidden}
      .note{margin-top:16px;color:#a7f3d0;font-size:15px}
    </style></head><body><div class="wrap"><h1>${title}</h1><h2>${source}</h2><pre>${code}</pre><div class="note">${note}</div></div></body></html>`;
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(html);
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, {'Content-Type': 'text/plain'});
    res.end('POST only');
    return;
  }
  const folderKey = url.searchParams.get('folder') ?? '';
  const fileName = url.searchParams.get('file') ?? '';
  if (!folders[folderKey] || !/^[A-Za-z0-9][A-Za-z0-9 ._-]*\.png$/.test(fileName)) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end('Invalid folder or file name');
    return;
  }
  const folderPath = path.join(root, folders[folderKey]);
  fs.mkdirSync(folderPath, {recursive: true});
  const target = path.join(folderPath, fileName);
  const output = fs.createWriteStream(target);
  let size = 0;
  req.on('data', chunk => { size += chunk.length; });
  req.pipe(output);
  output.on('finish', () => {
    console.log(`Saved ${folderKey}/${fileName} (${size} bytes)`);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(`saved ${fileName} (${size} bytes)`);
  });
  output.on('error', err => {
    console.error(`Receiver error: ${err.message}`);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(err.message);
  });
});

server.listen(8765, '127.0.0.1', () => {
  console.log('Screenshot receiver listening on http://127.0.0.1:8765/');
});
