// Trims a character GLB down to only the animation clips this app actually
// plays, and removes anything that becomes unreferenced once they're gone
// (unused skeleton nodes, an unused UV-coordinate accessor when there's no
// texture to sample, etc). Used once to turn the original ~1.53MB "Business
// Man" placeholder (24 baked clips) from poly.pizza into the ~1.22MB
// assets/character.glb actually shipped (2 clips: Idle_Neutral + Wave) —
// see the comment on CONFIG.assets.characterModelUrl in index.html.
//
// Re-run this if you swap in a different GLB and want the same trim, or if
// the app starts using a different set of clips (update KEEP_CLIPS below to
// match whatever Character.actions.* keys index.html actually looks up).
//
// Usage:
//   npm install      # first time only (adds @gltf-transform/core + /functions)
//   node strip-character-animations.mjs <input.glb> <output.glb> [clipName...]
//   # e.g. the exact command used to produce assets/character.glb:
//   node strip-character-animations.mjs original.glb ../assets/character.glb \
//     "CharacterArmature|Idle_Neutral" "CharacterArmature|Wave"
import { NodeIO } from "@gltf-transform/core";
import { prune, dedup } from "@gltf-transform/functions";

const [, , input, output, ...clipArgs] = process.argv;
if (!input || !output) {
  console.error("Usage: node strip-character-animations.mjs <input.glb> <output.glb> [clipName...]");
  process.exit(1);
}
const KEEP_CLIPS = new Set(clipArgs.length ? clipArgs : [
  "CharacterArmature|Idle_Neutral",
  "CharacterArmature|Wave"
]);

const io = new NodeIO();
const doc = await io.read(input);
const root = doc.getRoot();

const before = root.listAnimations().length;
for (const anim of root.listAnimations()) {
  if (!KEEP_CLIPS.has(anim.getName())) anim.dispose();
}
const after = root.listAnimations().length;

await doc.transform(prune(), dedup());
await io.write(output, doc);

console.log(`${input} → ${output}`);
console.log(`animations: ${before} → ${after} (kept: ${[...KEEP_CLIPS].join(", ")})`);
