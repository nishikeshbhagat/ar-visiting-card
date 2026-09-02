// Regenerates assets/card-target.jpg — the physical card's reference photo,
// including the REAL, scannable QR code baked into its bottom-right corner
// (encodes CARD_URL below; this is what a phone camera/Google Lens actually
// reads off the printed card, not decoration).
//
// Run this whenever CARD_URL changes (keep it in sync with CARD_QR_URL in
// index.html — see tools/regenerate-qr.mjs, which updates that side), or
// whenever you want to tweak the card's design. After running this, you
// MUST recompile the tracking target: `npm run compile` (see
// compile-target.mjs) — the .mind file is derived from this image's exact
// pixels, so a stale compile will silently mistrack.
//
// Usage:
//   npm install      # first time only
//   node generate-card-image.mjs [url]
//   (or just `node generate-card-image.mjs` to use the URL already below)
import { createCanvas } from "canvas";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const CARD_URL = process.argv[2] || "https://googlescan.netlify.app/";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "card-target.jpg");

const W = 1200, H = 740;
const c = createCanvas(W, H);
const g = c.getContext("2d");

const accent = "#63d3ff";
const accent2 = "#8a7bff";

function rr(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---- background card body ----
const pad = 8, R = 46;
const bgGrad = g.createLinearGradient(0, 0, W, H);
bgGrad.addColorStop(0, "#0d1526");
bgGrad.addColorStop(0.55, "#0a1120");
bgGrad.addColorStop(1, "#070c17");
rr(pad, pad, W - pad * 2, H - pad * 2, R);
g.fillStyle = bgGrad;
g.fill();
g.lineWidth = 4;
g.strokeStyle = "rgba(120,170,230,.35)";
g.stroke();

// subtle diagonal texture lines (adds feature-rich detail for tracking, low contrast so it doesn't fight the text)
g.save();
rr(pad, pad, W - pad * 2, H - pad * 2, R);
g.clip();
g.strokeStyle = "rgba(120,170,230,.05)";
g.lineWidth = 2;
for (let x = -H; x < W; x += 26) {
  g.beginPath();
  g.moveTo(x, 0);
  g.lineTo(x + H, H);
  g.stroke();
}
g.restore();

// ---- left accent bar ----
g.save();
g.beginPath();
g.rect(pad, pad, 16, H - pad * 2);
g.clip();
const barGrad = g.createLinearGradient(0, 0, 0, H);
barGrad.addColorStop(0, accent);
barGrad.addColorStop(1, accent2);
g.fillStyle = barGrad;
g.fillRect(pad, pad, 16, H - pad * 2);
g.restore();

// ---- logo mark (two chevrons) ----
g.strokeStyle = accent;
g.fillStyle = accent;
g.lineWidth = 8;
g.lineCap = "round";
g.lineJoin = "round";
g.beginPath();
g.moveTo(96, 108);
g.lineTo(160, 168);
g.lineTo(96, 228);
g.stroke();
g.beginPath();
g.moveTo(160, 108);
g.lineTo(160, 228);
g.stroke();

// ---- name / title / tagline ----
g.fillStyle = "#f2f7ff";
g.font = "700 68px Arial";
g.fillText("NISHIKESH BHAGAT", 96, 330);

g.fillStyle = accent;
g.font = "600 38px Arial";
g.fillText("SOFTWARE ENGINEER", 98, 384);

g.fillStyle = "rgba(190,205,230,.78)";
g.font = "400 30px Arial";
g.fillText("AI  •  WEB  •  3D", 98, 428);

// divider
g.strokeStyle = "rgba(140,170,220,.25)";
g.lineWidth = 2;
g.beginPath();
g.moveTo(98, 470);
g.lineTo(W - 260, 470);
g.stroke();

// ---- contact "pill" row: Website / LinkedIn / WhatsApp ----
const pills = [
  { label: "WEBSITE", color: accent },
  { label: "LINKEDIN", color: "#4aa3ff" },
  { label: "WHATSAPP", color: "#25D366" }
];
let px = 98, py = 512, ph = 58;
g.font = "600 26px Arial";
pills.forEach((p) => {
  const tw = g.measureText(p.label).width;
  const pw = tw + 74;
  g.beginPath();
  g.arc(px + 30, py + ph / 2, 9, 0, Math.PI * 2);
  g.fillStyle = p.color;
  g.fill();
  rr(px, py, pw, ph, ph / 2);
  g.strokeStyle = "rgba(150,180,230,.35)";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#e8f0ff";
  g.fillText(p.label, px + 54, py + ph / 2 + 9);
  px += pw + 22;
});

// ---- REAL, scannable QR code bottom-right (encodes CARD_URL — this is the
// actual launcher a phone camera/Google Lens reads, not decoration) ----
const qSize = 220, qx = W - qSize - 90, qy = H - qSize - 80;
const qrData = QRCode.create(CARD_URL, { errorCorrectionLevel: "M" });
const modSize = qrData.modules.size, modData = qrData.modules.data;
const cellPx = qSize / modSize;
g.fillStyle = "rgba(230,240,255,.92)";
g.fillRect(qx - 16, qy - 16, qSize + 32, qSize + 32);
g.fillStyle = "#0a1120";
for (let y = 0; y < modSize; y++) {
  for (let x = 0; x < modSize; x++) {
    if (modData[y * modSize + x]) g.fillRect(qx + x * cellPx, qy + y * cellPx, cellPx, cellPx);
  }
}

// small caption under QR
g.fillStyle = "rgba(180,200,230,.55)";
g.font = "400 20px Arial";
g.fillText("SCAN TO CONNECT", qx - 6, qy + qSize + 56);

// corner tick marks (extra asymmetric detail near all 4 corners helps tracking robustness)
g.strokeStyle = "rgba(150,180,230,.4)";
g.lineWidth = 3;
[[40,40],[W-40,40],[40,H-40],[W-40,H-40]].forEach(([x,y],idx)=>{
  const s = 26;
  g.beginPath();
  if(idx===0){g.moveTo(x,y+s);g.lineTo(x,y);g.lineTo(x+s,y);}
  if(idx===1){g.moveTo(x-s,y);g.lineTo(x,y);g.lineTo(x,y+s);}
  if(idx===2){g.moveTo(x,y-s);g.lineTo(x,y);g.lineTo(x+s,y);}
  if(idx===3){g.moveTo(x-s,y);g.lineTo(x,y);g.lineTo(x,y-s);}
  g.stroke();
});

fs.writeFileSync(OUT, c.toBuffer("image/jpeg", { quality: 0.92 }));
console.log(`wrote ${OUT} (${fs.statSync(OUT).size} bytes), QR encodes: ${CARD_URL}`);
