// Rasterize the checked-in SVG artwork for social crawlers and legacy favicons.
// Requires Playwright on NODE_PATH; does not build or publish the website.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent('<style>html,body{margin:0}</style>' + fs.readFileSync(path.join(root, 'img/brand/og-card.svg'), 'utf8'));
    await page.screenshot({ path: path.join(root, 'og-image.png') });
    await page.setViewportSize({ width: 64, height: 64 });
    await page.setContent('<style>html,body{margin:0;background:transparent}</style>' + fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8'));
    const png = await page.screenshot({ omitBackground: true });
    const header = Buffer.alloc(22);
    header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
    header[6] = 64; header[7] = 64;
    header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
    fs.writeFileSync(path.join(root, 'favicon.ico'), Buffer.concat([header, png]));
    console.log('Created og-image.png (1200×630) and favicon.ico (64×64) from local SVG sources.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
