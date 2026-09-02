// Regenerates the MindAR image-target file (targets/card.mind) from a card photo.
//
// Run this whenever you replace assets/card-target.jpg with a new photo of the
// physical card (e.g. the final printed design). MindAR's tracker doesn't read
// the .jpg directly at runtime — it needs this pre-compiled feature database.
//
// Usage (from this tools/ folder):
//   npm install
//   npm run compile
// or directly:
//   node compile-target.mjs <input-image> <output.mind>
import { OfflineCompiler } from "mind-ar/src/image-target/offline-compiler.js";
import { loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(__dirname, process.argv[2] || "../assets/card-target.jpg");
const outputPath = path.resolve(__dirname, process.argv[3] || "../targets/card.mind");

const img = await loadImage(inputPath);
console.log(`Loaded ${inputPath}: ${img.width}x${img.height} (aspect ${(img.height / img.width).toFixed(4)})`);
console.log(`If this aspect ratio differs from the previous card, update CONFIG.assets.targetAspect in ar-card.html to match.`);

const compiler = new OfflineCompiler();
await compiler.compileImageTargets([img], (percent) => {
  process.stdout.write(`\rCompiling... ${percent.toFixed(1)}%   `);
});
console.log("\nDone.");

const buffer = compiler.exportData();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(buffer));
console.log(`Wrote ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
