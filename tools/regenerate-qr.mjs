// Regenerates the real, scannable QR module data used by this project.
//
// Run this whenever the deployed WebAR URL changes. It prints a ready-to-
// paste CARD_QR_MATRIX object — copy it over the existing one in
// index.html (search for "const CARD_QR_MATRIX") and update CARD_QR_URL
// right above it to match.
//
// This QR data is used for the demo-mode virtual card's texture. The
// PHYSICAL card's QR (in assets/card-target.jpg, and on the real printed
// card once you replace the placeholder) is a separate image — if you
// regenerate that photo too, run `npm run compile` afterward to rebuild
// the tracking target.
//
// Usage:
//   npm install      # first time only
//   npm run qr -- "https://your-real-url.example.com/"
//   (or just `npm run qr` to use the URL already baked into this script)
import QRCode from "qrcode";

const url = process.argv[2] || "https://ar-card-by-nishikesh.netlify.app/";

const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
const size = qr.modules.size;
const data = qr.modules.data;

const rows = [];
for (let y = 0; y < size; y++) {
  let row = "";
  for (let x = 0; x < size; x++) row += data[y * size + x] ? "1" : "0";
  rows.push(row);
}

console.log(`URL encoded: ${url}`);
console.log(`Module grid size: ${size}x${size}\n`);
console.log("Paste this into index.html, replacing the existing CARD_QR_URL and CARD_QR_MATRIX:\n");
console.log(`  const CARD_QR_URL = "${url}";`);
console.log(`  const CARD_QR_MATRIX = {`);
console.log(`    size: ${size},`);
console.log(`    rows: ${JSON.stringify(rows)}`);
console.log(`  };`);
