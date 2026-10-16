/**
 * Draws two invented paper delivery orders as PNGs for the photo-intake demo (slide 8: "photos of paper DOs").
 *   node scripts/generate-do-images.mjs        (needs playwright and a Chromium; not part of the app or its tests)
 * Output: data/synthetic/do-images/do-01.png and do-02.png. Every party is fictional; nothing is a real document.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const out = join(process.cwd(), "data", "synthetic", "do-images");
mkdirSync(out, { recursive: true });

const sheet = (rows, stamp) => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#d9d6cf">
<div style="width:760px;height:520px;background:#fbf9f3;margin:20px;padding:26px 34px;box-sizing:border-box;position:relative;font-family:'Courier New',monospace;color:#1d2b4f;border:1px solid #b9b4a6">
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1d2b4f;padding-bottom:8px"><b style="font-size:22px">DELIVERY ORDER</b><span>No. <b style="font-family:'Comic Sans MS',cursive">${rows.no}</b></span></div>
  <p style="margin:14px 0 4px">Plant S (fictional) &nbsp;|&nbsp; AAC block delivery &nbsp;|&nbsp; Date: <span style="font-family:'Comic Sans MS',cursive;font-size:19px">${rows.date}</span></p>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:16px">
    <tr style="border-bottom:1px solid #1d2b4f"><td style="padding:6px 0;width:34%">Customer / site</td><td style="font-family:'Comic Sans MS',cursive;font-size:20px">${rows.customer}</td></tr>
    <tr style="border-bottom:1px solid #1d2b4f"><td style="padding:10px 0">Item</td><td style="font-family:'Comic Sans MS',cursive;font-size:20px">${rows.item}</td></tr>
    <tr style="border-bottom:1px solid #1d2b4f"><td style="padding:10px 0">Quantity</td><td style="font-family:'Comic Sans MS',cursive;font-size:20px">${rows.qty}</td></tr>
    <tr style="border-bottom:1px solid #1d2b4f"><td style="padding:10px 0">Needed by</td><td style="font-family:'Comic Sans MS',cursive;font-size:20px">${rows.by}</td></tr>
    <tr><td style="padding:10px 0">PO / call-off</td><td style="font-family:'Comic Sans MS',cursive;font-size:20px">${rows.po}</td></tr>
  </table>
  <div style="position:absolute;right:46px;bottom:34px;border:3px solid #a33;color:#a33;padding:6px 14px;transform:rotate(-8deg);font-weight:bold;letter-spacing:2px">${stamp}</div>
  <div style="position:absolute;left:34px;bottom:22px;font-size:12px;color:#6c6a60">Invented for the Plant Load Radar demo. Not a real document.</div>
</div></body>`;

const sheets = [
  { file: "do-01.png", stamp: "RECEIVED", rows: { no: "DO-4471", date: "12/10/2026", customer: "Contractor E", item: "AAC block 150 mm", qty: "400 m3", by: "Wed 21 Oct", po: "PO E-2290" } },
  { file: "do-02.png", stamp: "CHECK", rows: { no: "DO-4472", date: "12/10/2026", customer: "Site D", item: "AAC 100mm", qty: "12 pallets", by: "next Tue", po: "-" } },
];

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 800, height: 560 } });
for (const s of sheets) {
  await page.setContent(sheet(s.rows, s.stamp));
  await page.screenshot({ path: join(out, s.file) });
  console.log(`wrote data/synthetic/do-images/${s.file}`);
}
await browser.close();
