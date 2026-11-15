import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const publicDir = path.join(siteRoot, 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

const require = createRequire(path.join(siteRoot, 'package.json'));
const { chromium } = require('playwright');

function packIco(entries) {
  const headerSize = 6 + entries.length * 16;
  const totalDataSize = entries.reduce((sum, e) => sum + e.png.length, 0);
  const out = Buffer.alloc(headerSize + totalDataSize);

  // ICONDIR
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type = 1 (ICO)
  out.writeUInt16LE(entries.length, 4);

  let dataOffset = headerSize;
  entries.forEach(({ size, png }, idx) => {
    const dirOffset = 6 + idx * 16;
    out.writeUInt8(size >= 256 ? 0 : size, dirOffset + 0); // width
    out.writeUInt8(size >= 256 ? 0 : size, dirOffset + 1); // height
    out.writeUInt8(0, dirOffset + 2); // color palette count
    out.writeUInt8(0, dirOffset + 3); // reserved
    out.writeUInt16LE(1, dirOffset + 4); // color planes
    out.writeUInt16LE(32, dirOffset + 6); // bits per pixel (RGBA)
    out.writeUInt32LE(png.length, dirOffset + 8); // payload byte length
    out.writeUInt32LE(dataOffset, dirOffset + 12); // payload offset
    png.copy(out, dataOffset);
    dataOffset += png.length;
  });

  return out;
}

const rawSvg = fs.readFileSync(svgPath, 'utf8').trim();

// Full-bleed opaque 180x180 square for iOS/Safari apple-touch-icon (iOS applies its own squircle mask)
const appleTouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#0d5c4d"/>
  <g transform="translate(18, 18) scale(2.25)">
    <path d="M14 31L32 16l18 15v17a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V31z" fill="none" stroke="#faf8f5" stroke-width="4" stroke-linejoin="round"/>
    <path d="M26 50V36h12v14" fill="none" stroke="#faf8f5" stroke-width="4" stroke-linejoin="round"/>
  </g>
</svg>`;

const browser = await chromium.launch({ headless: true });

try {
  const icoSizes = [16, 32, 48];
  const icoEntries = [];

  for (const size of icoSizes) {
    const context = await browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(
      `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${rawSvg}</body></html>`,
      { waitUntil: 'load' },
    );
    const png = await page.screenshot({ type: 'png', omitBackground: true });
    icoEntries.push({ size, png });
    await context.close();
  }

  const icoBuffer = packIco(icoEntries);
  const icoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(
    `build-icons: wrote public/favicon.ico (${icoSizes.join('x, ')}x px, ${icoBuffer.length} B)`,
  );

  const touchContext = await browser.newContext({
    viewport: { width: 180, height: 180 },
    deviceScaleFactor: 1,
  });
  const touchPage = await touchContext.newPage();
  await touchPage.setContent(
    `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:180px;height:180px;overflow:hidden;background:#0d5c4d}svg{display:block;width:180px;height:180px}</style></head><body>${appleTouchSvg}</body></html>`,
    { waitUntil: 'load' },
  );
  const touchPng = await touchPage.screenshot({ type: 'png', omitBackground: false });
  const touchPath = path.join(publicDir, 'apple-touch-icon.png');
  fs.writeFileSync(touchPath, touchPng);
  await touchContext.close();
  console.log(`build-icons: wrote public/apple-touch-icon.png (180x180 px, ${touchPng.length} B)`);
} finally {
  await browser.close();
}
