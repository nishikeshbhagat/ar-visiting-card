# AR Visiting Card — real image-target prototype

Point a phone camera at a physical card and AR content anchors to it. No fake
timers — the card itself is the trigger.

## What's actually real here (read this first)

| Part | Status |
|---|---|
| Camera feed | **Real.** `getUserMedia`, rear camera, live video. |
| Card recognition | **Real.** [MindAR](https://hiukim.github.io/mind-ar-js-doc/) image-target tracking — computer-vision feature matching against a compiled target file, running every camera frame. Nothing is simulated or timer-based in this path. |
| Anchoring / tracking | **Real.** The character, particles and lights follow MindAR's tracked pose (smoothed for stability — see "Tracking stability" below). Move the card, they move with it. Cover the card, they disappear after a short grace period. |
| "Demo mode" | **Simulated, and labeled as such in the UI** (orange "DEMO MODE" badge). Detects on a fixed timer, no camera, no CV. It exists only as a desktop/no-camera preview of the visual experience — never confuse it with the real thing. |
| The card design | **Temporary placeholder**, generated for this prototype (see below). Swap it for your real card and recompile the target — that's it. |
| The 3D character | **Temporary GLB placeholder** — "Business Man" by Quaternius (CC0, via poly.pizza), a low-poly character in a suit and tie, not a custom character yet. Real, animated, not procedural — re-hosted locally at `assets/character.glb` and trimmed to just the 2 clips (Idle, Wave) this app plays, down from the original 24 (see "Performance notes"). Swap for your own GLB via `CONFIG.assets.characterModelUrl` — set it to `null` to fall back to the original hand-built procedural character instead. |
| The QR code | **Real and scannable** — genuinely encodes the deployed URL (`CARD_QR_URL` in `index.html`), generated with the `qrcode` library, not a decorative pattern. Any QR reader (Google Lens included) will read it correctly. Printed identically on the card image and drawn on the demo-mode virtual card. |

If you only remember one thing: **real mode has no detection timer anywhere in
its code path.** `App.onTrackingConfirmed()` is called only when MindAR's
tracker — filtered through the app's own stabilization layer, see "Tracking
stability" below — actually confirms the camera frame matches the compiled
target.

## Why MindAR (and not the alternatives)

- **AR.js image tracking** — older NFT tracker, noticeably less robust,
  clunkier multi-file target format, less actively maintained.
- **WebXR Image Tracking module** — the "real" web standard, but practically
  unusable today: no iOS Safari support at all, and Android Chrome support is
  experimental/flag-gated. Your explicit target (Android Chrome + iPhone
  Safari) rules this out.
- **8th Wall** — excellent, but proprietary/paid and needs an account + app
  key. Overkill and against the spirit of a free temporary prototype.
- **MindAR** — open source, MIT licensed, works in plain Android Chrome and
  iOS Safari today, ships a Three.js integration that hands you a tracked
  anchor `Group` with position/rotation/scale already resolved every frame,
  and — importantly — ships a **Node-compatible offline compiler**, so target
  files can be regenerated from a script instead of a manual browser upload
  step (see `tools/`).

**Honest limitation:** MindAR tracks a single flat image well when it has
good visual detail (text alone tracks poorly — logos/photos/QR-like blocks
help). A very plain, symmetric, low-contrast card will track worse. It also
needs a reasonably lit, reasonably steady frame — extreme motion blur or very
low light will lose tracking, same as any camera-based CV system.

## Project structure

```
ar-card/
├── index.html                        the app (open this)
├── assets/
│   ├── card-target.jpg           the physical card's reference photo — REPLACE THIS
│   └── character.glb             the 3D character model — see "What's actually real"
├── targets/
│   └── card.mind                 compiled tracking data for the image above —
│                                   REGENERATE after replacing the photo (see tools/)
├── tools/
│   ├── compile-target.mjs        regenerates targets/card.mind
│   ├── regenerate-qr.mjs         regenerates the baked-in QR module data
│   ├── strip-character-animations.mjs  trims a GLB's animation clips (see Performance notes)
│   └── package.json
└── README.md                      this file
```

Nothing about the card is hardcoded elsewhere — every reference to it goes
through `CONFIG.assets.targetImageUrl` / `CONFIG.assets.mindTargetUrl` /
`CONFIG.assets.targetAspect` at the top of `index.html`.

## Replacing the temporary card with your real one

1. Take a clean, well-lit, flat-on photo of the real card (or export a flat
   render of the design). More visual detail (logo, photo, texture — not just
   plain text on a plain background) tracks noticeably better.
2. Save it as `assets/card-target.jpg` (or update `CONFIG.assets.targetImageUrl`
   if you rename it).
3. Regenerate the compiled target:
   ```
   cd tools
   npm install      # first time only
   npm run compile
   ```
   This runs entirely offline in Node (no browser upload step needed) and
   overwrites `targets/card.mind`. It prints the image's aspect ratio —
   update `CONFIG.assets.targetAspect` in `index.html` to match (this only
   affects how high above the card's top edge the character floats; a small
   mismatch is harmless).
4. Reload the page. That's the entire swap — nothing else in the app
   references the card image directly.

## The QR code / launch flow

The intended real-world flow is: **print the card → someone scans the QR
with Google Lens (or any camera app) → it shows a link → they tap it → this
page opens → camera starts → they point it at the same physical card.** The
QR is only ever the *launcher* — nothing about image tracking depends on it,
and the user never scans anything a second time.

The QR baked into `assets/card-target.jpg` (and drawn on the demo-mode
virtual card) is a **real** QR code encoding an actual URL — not a
decorative pattern. If you deploy to a different URL than the one already
baked in:

1. `cd tools && npm install` (first time only)
2. `npm run qr -- "https://your-real-deployed-url.example.com/"`
3. Copy the printed `CARD_QR_URL` and `CARD_QR_MATRIX` output over the
   existing ones in `index.html` (search for `CARD_QR_URL`).
4. If you also regenerate `assets/card-target.jpg` with the new QR baked
   into the photo/design, run `npm run compile` afterward (see above) —
   the QR is part of the tracked image, so the target needs rebuilding.

The on-screen instruction shown once the camera starts (`"Point your camera
at your card ✨"`) needs no changes — it's already generic.

1. Get a `.glb` (embedded textures, one file — see the export guidance you
   already have for Meshy or similar tools).
2. Host it somewhere reachable over HTTPS and set
   `CONFIG.assets.characterModelUrl` in `index.html` to that URL — or drop
   it in `assets/` and point it at a relative path.
3. **If your model has baked animations**, `Character.build()`'s GLB branch
   will pick them up automatically (stripping any `ArmatureName|` prefix
   some exporters add, like `CharacterArmature|Wave`) and look for clips
   named `Idle` (looped continuously while the character is active) and
   `Wave` / `ThumbsUp` / `Yes` (played once when the character activates,
   then it auto-returns to `Idle`). Name your clips to match, or edit the
   `wave()` method in `index.html` to reference whatever clip names your
   export actually has. If your pack ships both a combat-ready `Idle` and a
   calmer `Idle_Neutral`, the code already prefers `Idle_Neutral` when
   present — check both if the default idle pose looks off (game-character
   packs often default `Idle` to a weight-shifted "ready" stance, not a
   plain standing one). **If it has no animations**, that's fine — it'll
   just render as a static model with the existing group-level bob/sway
   motion.
4. Re-check the size on screen: `CONFIG.ar.characterModelScale` normalizes
   whatever arbitrary scale your model was exported at back to roughly what
   the previous character occupied. Every GLB export uses a different unit
   scale, so this is the one value you'll almost certainly need to adjust —
   there's no way to guess it correctly in advance for an arbitrary file.
5. Set `characterModelUrl` to `null` at any point to fall back to the
   original hand-built procedural character (no GLB, no network request).

## Running it locally

You need a real HTTP(S) server — **opening `index.html` directly as a
`file://` URL will not work** (camera access requires a secure context, and
`targets/card.mind` is loaded via `fetch()`, which browsers block for local
files). From the project root:

```
npx serve .
```

(or any static server — `python -m http.server`, VS Code's Live Server, etc.)
then open the printed `http://localhost:PORT/` URL. `localhost`
counts as a secure context, so real camera mode works here even without
HTTPS, on the same machine.

## Testing on your phone (this is the part that actually matters)

Your phone needs to reach the page over **HTTPS** (or `localhost`, which
doesn't apply to a separate phone). Two options:

### Fast iteration: a temporary HTTPS tunnel
```
npx serve .
```
then, in a second terminal:
```
npx localtunnel --port 3000
```
(match the port `serve` printed). It prints a public `https://...loca.lt` URL
— open that on your phone. Every reload while you're iterating on the code
just needs the tunnel left running; `serve` picks up file changes on refresh.
(`ngrok http 3000` works the same way if you already have it installed.)

### Stable link: GitHub Pages
```
git init
git add .
git commit -m "AR visiting card prototype"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
Then in the repo's Settings → Pages, deploy from the `main` branch. Your app
will be live at `https://<you>.github.io/<repo>/` — a real HTTPS
URL, permanently, no tunnel needed. This is the better option once you're
past active iteration.

## Testing with the physical card

1. Print (or display on another screen) `assets/card-target.jpg`, or your
   replacement card once you've swapped it in.
2. Open the deployed URL on your phone (typically via the QR code printed
   on the card itself — see "The QR code / launch flow" below). A short
   branded intro plays for ~1.6s and then **auto-advances into the camera
   flow** — no button tap required (tapping anywhere skips the wait
   immediately if you don't want to watch it). Allow camera access when
   prompted.
3. Point the rear camera at the card. Status pill should read "Point your
   camera at your card ✨".
4. Card recognized → status flips to "Card detected ✓", particles burst,
   the character rises out of the card, scales up, waves, then settles into
   idle animation; social buttons pop in around it.
5. Move the phone slightly — character should stay locked to the card.
6. Move the phone closer/farther — the content should scale with perspective
   naturally (this comes for free from real tracking, not a hack).
7. Physically move the card — the content should follow it.
8. Point the camera away — status flips to "Card lost — move camera back to
   the card", buttons/HUD hide.
9. Point back at the card — "Tracking resumed ✓", content reappears.
10. Tap a social button — it should open the right link (WhatsApp/LinkedIn/
    etc. — edit these in `CONFIG.profile.links`).

If any of steps 3–9 don't behave as described, real tracking isn't working —
see Troubleshooting.

### Real-device checklist (do this on an actual phone — see below for why)

Repeat steps A–M on at least three phones spanning your real user base: a
**new/high-end** phone (last ~2 years, flagship or upper-mid), a **mid-range**
phone (typical 2-3 year old Android), and an **older/low-end** phone (budget
Android, 4+ years old, or anything that visibly struggles with other camera
apps). The tracking-lifecycle fix below was specifically about the low-end
tier — that's the phone most likely to reveal a regression.

| # | Step | Expected result |
|---|---|---|
| A | Open the AR link | Intro plays, auto-advances (or tap to skip) |
| B | Allow camera | Camera view appears, status "Point your camera at your card ✨" |
| C | Show the card, centered and well-lit | "Card detected ✓" within ~1-2s |
| D | Verify the character | Emerges, waves, settles into idle; feet stay on the card surface, no floating/sinking |
| E | Move the card slightly (small shake) | Character stays locked, no visible jitter, no flicker to "lost" |
| F | Tilt the card | Character tilts with it, stays anchored |
| G | Slowly move the card toward the frame edge | Content follows smoothly to the edge |
| H | **Fully remove the card from view** (this is the bug this fix targets) | Character, light beam, and social buttons must disappear — status flips to "Card lost". On the older/low-end phone in particular, this should happen within roughly half a second to ~1-1.5s of the card leaving frame, **not** several seconds later and never "stuck forever" |
| I | While the card is still out of view, wait ~3 more seconds | Content stays hidden — it must not reappear or flash back in on its own |
| J | Verify buttons are actually gone, not just character | Tap where a button used to be — nothing should happen (buttons are hidden, not just visually obscured) |
| K | Bring the card back into view | "Tracking resumed ✓", character/buttons reappear using the card's **current** position (not where it used to be) |
| L | Repeat H–K three or four times in a row | Same correct behavior every time — no "gets stuck" on a later cycle |
| M | Watch for jitter throughout | Content should be visually stable while tracking normally — the fixes below tightened *loss* detection, not steady-state smoothing, so this should be unchanged from before |

If step H fails only on the low-end phone (content lingers noticeably longer
or never clears), open debug mode (`?debug=1`) on that phone and check the
`DEVICE TIER` and `FPS` fields while repeating the test — see "Device tiers"
below for what those numbers mean and how to report it usefully.

**What Playwright (this project's automated browser testing) can and can't
verify here:** Playwright *can* drive the app's own state machine and pose
smoother directly with synthetic data, confirm `DeviceTier` classifies
simulated low/medium/high-spec profiles correctly, confirm the resulting
pixel-ratio cap and particle counts actually apply to the renderer, and catch
console errors/regressions across a full demo-mode run. It *cannot* simulate
a physical camera seeing a real card being physically removed, cannot
reproduce a real low-end device's actual CPU/GPU throughput (only spoof the
`navigator` properties DeviceTier reads), and this project's testing
sandbox specifically avoids requesting real camera access without your
explicit go-ahead for that one test. That's why steps A–M above have to be
done on real hardware — nothing in the automated test suite substitutes for
it.

## Debug mode

Tap the small 🐞 button (top-right), or open the page with `?debug=1` in the
URL to have it open automatically, for a live panel showing:
```
CAMERA: ready
TRACKER: SEARCHING / ACTIVE
TARGET: FOUND (raw) / LOST (raw)     ← MindAR's raw, un-smoothed signal
STATE: searching / card_detected / ar_active / card_lost / tracking_resumed
FPS: 58
QUALITY: full / reduced: pixelRatio=1 / reduced: pixelRatio=1, particles off
DEVICE TIER: high / medium / low     ← quality only, see "Device tiers" below
```
`TARGET` shows MindAR's raw found/lost signal (fast, noisy — good for
confirming the tracker itself is seeing the card at all); `STATE` shows the
app's smoothed/confirmed state (what actually drives the UI). `QUALITY`
shows whether the automatic performance downgrade (see below) has kicked in.

Also, for deeper troubleshooting on a real device, open Chrome's remote
debugging (`chrome://inspect` from a laptop over USB) or Safari's Web
Inspector for iOS, and in the console run:
```js
__AR__.App.onTrackingConfirmed()      // force the emerge/wave/buttons sequence
__AR__.App.onTrackingLostConfirmed()  // force the "card lost" state
__AR__.PoseSmoother                   // inspect smoothing state directly
```
Useful for checking the character/buttons animation without needing the
physical card in frame every time.

## State machine

```
IDLE → CAMERA_READY → SEARCHING → CARD_DETECTED → EMERGE → AR_ACTIVE
                                                              │
                                              CARD_LOST ←─────┘
                                                  │
                                                  └──→ TRACKING_RESUMED → AR_ACTIVE
```
`RealTracker` exposes MindAR's raw found/lost signal only for the debug
panel. The app's actual state transitions are driven by `Stage`/
`PoseSmoother`'s **smoothed** visibility instead
(`App.onTrackingConfirmed()` / `App.onTrackingLostConfirmed()`, called from
the single render loop) — so a single noisy tracking frame can't flicker the
UI. `Stage`, `Character` and `UI` never touch MindAR internals directly, so
the tracking library could be swapped later without touching them.

## Tracking stability (why it doesn't jitter)

MindAR hands over a fresh 4×4 pose matrix every processed camera frame, and
applying that directly to the 3D content is what causes visible shake — even
light computer-vision noise reads as jitter once it's driving a rendered
transform 30+ times a second. Two layers handle this:

1. **MindAR's own built-in filter** (a One-Euro filter over the raw matrix,
   plus frame-count found/lost debouncing) — tuned in `CONFIG.tracking.
   mindarFilterMinCF/mindarFilterBeta/mindarWarmupTolerance/
   mindarMissTolerance`. Kept deliberately light here, because filtering a
   raw matrix element-by-element can't preserve proper rotation math and
   can't apply different smoothing strength per channel.
2. **`PoseSmoother`** (`index.html`, search for `POSE SMOOTHER`) — the app's
   own layer, which does the real work: decomposes the raw matrix into
   position / quaternion / scale, **rejects single-frame outliers** (a spike
   is thrown away entirely rather than smoothed toward), applies
   **independent exponential smoothing per channel** (scale smoothed hardest,
   since sudden size changes are the most distracting artifact), and holds
   the last good pose through a **grace period** (`lostGraceMs`) before
   actually hiding content on a real loss. Content is parented to a
   `Stage.root` group that *this* layer drives — never directly to MindAR's
   raw anchor.

All of it is tunable in `CONFIG.tracking` without touching any other code —
see the comments there for what each knob does. If you still see shake after
a physical test, `positionTau`/`rotationTau`/`scaleTau` are the first things
to raise slightly (more smoothing, a bit more lag); if it feels laggy/rubbery
instead, lower them.

### Why content used to be able to linger after the card was removed

Two related bugs, both about **loss detection**, not steady-state smoothing:

1. `mindarWarmupTolerance`/`mindarMissTolerance` are **consecutive-frame
   counts** inside MindAR's own controller, not durations — MindAR only
   flips its raw signal to "lost" after that many processed frames in a row
   fail. On a slow device processing camera frames much less often, the same
   frame count takes proportionally longer in real time, so "how long until
   MindAR itself notices the card is gone" silently scaled with device
   speed instead of staying constant. Lowered both to `2` so this stage
   contributes only a small, roughly-constant delay, and pushed the actual
   "how long to tolerate a blip before hiding content" decision onto
   `lostGraceMs` below, which is genuinely wall-clock on every device.
2. `PoseSmoother`'s outlier-rejection path (raw tracking still reports
   `visible`, but the pose itself looks like garbage — a likely sign of a
   weak/failing match rather than a clean loss) had no time bound at all: it
   would keep coasting on the last good pose indefinitely instead of ever
   deciding the card was actually gone. It now applies the same
   `lostGraceMs` wall-clock timeout to sustained rejection, so a device that
   degrades into noisy false-positive matches instead of a clean "lost"
   signal can no longer freeze content on screen forever.

Both fixes only change *when the app decides tracking is lost*; they don't
touch the exponential smoothing that keeps steady-state tracking jitter-free,
so normal in-frame stability (step M in the checklist above) shouldn't be
affected.

### Device tiers (quality only — never tracking correctness)

`DeviceTier` (`index.html`, search for `DEVICE TIER`) runs once on startup
and classifies the device as `high`/`medium`/`low` from
`navigator.hardwareConcurrency`, `navigator.deviceMemory` (Chrome-only, best
effort), `devicePixelRatio`, mobile/desktop UA sniffing, and — where the
browser allows it — the GPU renderer string. This is deliberately
**quality-only**: it feeds `pixelRatioCap()` and `particleMultiplier()` into
the renderer's pixel ratio and the dust/burst particle counts, and nothing
else. It never touches `CONFIG.tracking`, `PoseSmoother`, or any found/lost
decision — a `low`-tier phone renders fewer particles at a lower resolution,
but is held to exactly the same "is the card actually there" logic as a
`high`-tier one. Check the `DEVICE TIER` field in debug mode
(`?debug=1`) to see what a given phone classified as.

## Performance notes

- MindAR's tracking bundle (~2MB) and the character GLB both start
  **prefetching in the background the instant the page loads** — during the
  ~1.6s intro animation — so they're warm in cache by the time the camera
  flow actually starts. Demo mode never fetches MindAR at all.
- Particle counts and beam geometry are deliberately smaller in real mode
  (`CONFIG.ar.effectsScale`) than demo mode, since real mode already spends
  CPU/GPU budget on the CV tracking itself every frame.
- Floating buttons are positioned with a CSS `transform`, not `left`/`top` —
  `transform` is compositor-only (GPU), while `left`/`top` forces a full
  layout recalculation on every one of the ~6 buttons, every frame.
- Hot-path temporaries (the vector used to project points to screen space,
  the vectors/quaternions `PoseSmoother` decomposes into) are allocated once
  and reused, not recreated every frame — avoids GC-pause micro-stutters.
- The render loop calls `renderer.render()` *before* projecting button
  positions, so buttons use the current frame's freshly updated world
  transform instead of lagging one frame behind the 3D content.
- **Adaptive quality**: if average FPS stays under 40 for a few consecutive
  ~1.5s windows, pixel ratio drops to 1, then (if still low) particles turn
  off. One-way — it won't oscillate quality up and down mid-session. Check
  the `QUALITY` field in debug mode to see if this has triggered.
- There is exactly **one** `requestAnimationFrame` render loop
  (`Stage._loop()`), used by both demo and real mode. MindAR's own
  `controller.processVideo()` runs a *separate* loop, but it's a CV
  frame-processing loop (driven by `tf.nextFrame()`, not
  `requestAnimationFrame`) that never calls `renderer.render()` — it's not a
  second competing render loop, just the unavoidable cost of doing image
  tracking at all.
- The camera is released (`pagehide` listener) when you navigate away or
  background the tab, so it doesn't keep running invisibly.
- **Known constraint:** MindAR's high-level `MindARThree` wrapper doesn't
  expose a way to constrain the camera's capture resolution — it uses
  whatever default the browser picks. On most modern phones that's already
  reasonable, but if FPS is still poor after the above on a specific device,
  the next lever would be dropping to MindAR's lower-level `Controller` API
  with a manually-constrained `getUserMedia` call — a bigger architecture
  change not included here since it wasn't the primary jitter cause.
- **Character GLB trimmed and re-hosted locally.** The original placeholder
  model came from a third-party CDN (poly.pizza) and shipped 24 baked
  animation clips (Death, Kick, Punch, Run, Walk, Roll, Gun/Sword variants,
  etc.) even though `Character.build()` only ever plays 2 of them (Idle,
  Wave) — see `Character.wave()`/`emerge()`. `tools/strip-character-
  animations.mjs` (via [gltf-transform](https://gltf-transform.dev/)) strips
  everything else and prunes whatever becomes unreferenced as a result
  (unused skeleton nodes, an unused UV-coordinate accessor now that there's
  no texture to sample), taking the file from 1.53MB to 1.22MB with
  **zero** visual difference — geometry, materials and the two kept clips
  are unchanged; only unused animation data was removed. It's now served
  from `assets/character.glb` (same origin as everything else, one fewer
  third-party network dependency) instead of the CDN URL. Re-run the script
  (`npm run strip-character -- <in.glb> <out.glb> [clipName...]` inside
  `tools/`) if you swap in a different GLB and want the same treatment.
- **Real-mode content pauses while the card is out of frame.** Dust/burst
  particle updates, the decorative panel's idle wobble, and the character's
  animation mixer all used to keep advancing every frame even while
  `Stage.root` was invisible (searching for the card, or coasting through
  `CARD_LOST`) — wasted GPU/CPU work on something nobody could see, for
  however long the user takes to find the card. `Stage._loop()` now skips
  that whole block when real-mode content isn't visible. This is purely a
  "don't animate what's hidden" gate — `PoseSmoother.update()` (the actual
  found/lost detection) still runs unconditionally every frame either way,
  so tracking responsiveness is completely unaffected; verified directly by
  driving a synthetic anchor through found → lost → reacquired and
  confirming the animation mixer and dust both froze exactly while hidden,
  and reacquisition still snapped to the card's fresh (not stale) transform.
- **Low-tier devices skip the decorative holographic panel entirely**
  (`DeviceTier.tier==="low"`) — it's explicitly atmospheric (see its own
  comment in `buildDataPanel`), and building it costs a ~1.5MB canvas
  texture plus a draw call for the least essential visual in the scene.
  Character, card, QR and buttons are unaffected at every tier.
- **Antialiasing (MSAA) is disabled in demo mode on low-tier devices** —
  one of the pricier renderer flags on weak mobile GPUs, especially stacked
  with a pixel ratio above 1. Real mode reuses MindAR's own renderer, which
  doesn't expose this flag, so this only applies to demo mode.
- **`backdrop-filter` (the frosted-glass look on buttons, the status pill,
  the HUD chip, the debug panel, etc.) is dropped on low-tier devices**,
  replaced by a flatter, more-opaque background at the same layout/contrast.
  Backdrop blur forces the compositor to keep re-sampling everything behind
  each blurred element — here, a live camera feed *and* a WebGL canvas,
  both updating every frame, under a dozen simultaneously-blurred elements —
  real, ongoing GPU cost that scales with how many glass panels are on
  screen, independent of anything Three.js-related. Set by `DeviceTier.
  detect()` toggling a `.perf-low` class on `<html>`; medium/high tiers keep
  the full glass look unchanged.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Camera needs HTTPS" screen | You opened the page over plain `http://` from a non-localhost address, or as a `file://` URL. Use one of the HTTPS options above. |
| "Camera permission blocked" | Check site permissions in your browser (address bar → site info → Camera), then reload. |
| "Couldn't start tracking" (camera opens, then this error) | `targets/card.mind` didn't load — usually means the page was opened as a local file instead of through a server, or the file is missing/moved. Confirm `targets/card.mind` exists and you're serving over http(s). |
| Card never gets recognized | Test with `assets/card-target.jpg` itself first (display it on a second screen or print it) before trying your replacement card — this isolates "my new card doesn't track well" from "tracking is broken." Make sure the card fills a reasonable portion of the frame, is flat, well lit, and not motion-blurred. |
| Model jitters/shakes | Should be fixed by `PoseSmoother` (see above) — if it's still visible, raise `CONFIG.tracking.positionTau`/`rotationTau`/`scaleTau` slightly. |
| Model feels laggy/delayed behind the card | Lower `positionTau`/`rotationTau` in `CONFIG.tracking` — you've likely got more smoothing than this device's tracking noise needs. |
| Model disappears briefly on small movements | Raise `CONFIG.tracking.lostGraceMs`. |
| Character appears in a weird position/size after swapping the card image | You changed the card's aspect ratio but didn't update `CONFIG.assets.targetAspect` to match (the compile script prints the correct value). |
| Console warning `THREE.WebGLRenderer: Property .outputEncoding has been removed` | Harmless — it comes from MindAR's own bundled code being built against an older Three.js API surface than the CDN version pinned here. Doesn't affect functionality. |
| Nothing happens after the intro / real-mode starts, for a long time, no error | Should no longer happen — real-mode startup is wrapped in a 15s timeout that surfaces a proper error instead of hanging silently. If you do hit this, it's worth reporting. |
| Low FPS | Check debug mode's `QUALITY` field — if adaptive downgrade already triggered and FPS is still poor, the device is genuinely under-powered for real-time CV tracking + 3D rendering together; try closing other apps/tabs. |

## Tuning after your first physical test

These are the first numbers worth adjusting once you've actually seen it on
your phone:

In `CONFIG.ar`:
- `characterScale` — how big the character is relative to the card's width.
- `characterLift` — how far above the card's top edge it floats.
- `effectsScale` — size of the beam/particles relative to demo mode.

In `CONFIG.tracking` (see "Tracking stability" above for the full picture):
- `positionTau` / `rotationTau` / `scaleTau` — smoothing strength per channel.
- `lostGraceMs` — how long a brief tracking blip is tolerated before hiding.
- `maxRelativePositionJump` / `maxRelativeScaleJump` / `maxRotationRadPerSec`
  — outlier-rejection thresholds, if legitimate fast motion is being
  incorrectly rejected as a spike (raise them) or obvious spikes are getting
  through (lower them).
