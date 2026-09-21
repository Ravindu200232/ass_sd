/* Render the assignment report source into print-ready HTML for Chrome PDF. */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const directory = __dirname;
const source = fs.readFileSync(path.join(directory, 'SE4030_Report.md'), 'utf8');
const body = marked.parse(source, { gfm: true, breaks: false });

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SE4030 Secure Software Development - Report</title>
  <style>
    @page { size: A4; margin: 16mm 15mm 17mm; }
    :root { color: #152235; background: #fff; font-family: Arial, Helvetica, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; font-size: 9.35pt; line-height: 1.45; }
    h1, h2, h3 { color: #0b2d56; line-height: 1.18; page-break-after: avoid; break-after: avoid-page; }
    h1 { font-size: 22pt; margin: 0 0 4mm; padding-bottom: 2.3mm; border-bottom: 2px solid #2167a7; }
    h2 { font-size: 15.2pt; margin: 8mm 0 3mm; padding-top: 1mm; border-bottom: 1px solid #b8cfdf; padding-bottom: 1.2mm; }
    h3 { font-size: 11.6pt; margin: 5.5mm 0 2mm; }
    h4 { font-size: 10pt; margin: 4mm 0 1.5mm; }
    p { margin: 0 0 2.5mm; }
    strong { color: #0b2d56; }
    a { color: #115e9e; text-decoration: none; overflow-wrap: anywhere; }
    ul, ol { margin: 1.4mm 0 3mm; padding-left: 5mm; }
    li { margin: 0.7mm 0; }
    blockquote { margin: 3mm 0; padding: 2mm 3.5mm; border-left: 3px solid #2167a7; background: #f2f7fb; color: #24394e; }
    blockquote p:last-child { margin-bottom: 0; }
    code { font-family: Consolas, 'Courier New', monospace; font-size: 8.35pt; background: #edf2f6; padding: .2mm .75mm; border-radius: 1px; overflow-wrap: anywhere; }
    pre { margin: 3mm 0; padding: 2.8mm; background: #102b46; color: #eff7ff; border-radius: 2px; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid-page; page-break-inside: avoid; }
    pre code { color: inherit; background: transparent; padding: 0; font-size: 7.8pt; line-height: 1.32; }
    table { width: 100%; margin: 3mm 0 4mm; border-collapse: collapse; font-size: 8.2pt; break-inside: avoid-page; page-break-inside: avoid; }
    th { background: #0b2d56; color: white; text-align: left; font-weight: 700; }
    th, td { padding: 1.6mm 1.9mm; border: 1px solid #cbd6df; vertical-align: top; }
    tr:nth-child(even) td { background: #f5f8fa; }
    hr { border: 0; border-top: 1px solid #b8cfdf; margin: 6mm 0; }
    img { max-width: 100%; }
    @media print { a { color: #0b2d56; } }
  </style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(path.join(directory, 'SE4030_Report.html'), html, 'utf8');
