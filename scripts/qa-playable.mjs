import { chromium } from "playwright";
import fs from "fs";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

async function waitApi(page) {
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(() => Boolean(window.__coteMelvyn?.sampleHeights && window.__coteMelvyn?.teleportDrive))) {
      return;
    }
    await page.waitForTimeout(200);
  }
  throw new Error("API not ready");
}

async function boot(page) {
  await page.goto("http://127.0.0.1:3000/?quality=eco", { waitUntil: "domcontentloaded", timeout: 120000 });
  await waitApi(page);
  await page.evaluate(() =>
    window.__coteMelvyn.setState({
      phase: "playing",
      mode: "driving",
      engineOn: true,
      loadStage: 3,
      showExplorerHint: false,
      isMobile: false,
      quality: "eco",
      muted: true,
      openChapter: null,
      rescueOpen: false,
    }),
  );
  await page.waitForSelector("canvas", { timeout: 60000 });
  await page.waitForTimeout(2800);
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await boot(page);

const bodyText = await page.locator("body").innerText();
const debugDefault = /screenDeltaX|steerYawDelta|key=none/.test(bodyText);
console.log("DEBUG_DEFAULT", debugDefault);

const corridor = await page.evaluate(() => {
  const hits = [];
  for (let i = 2; i <= 38; i++) {
    const t = i / 40;
    const a = window.__coteMelvyn.sampleHeights(-2.4, 44 - t * 230);
    // sample a grid around the ribbon
    for (const [dx, dz] of [
      [0, 0],
      [0, -8],
      [0, -16],
      [-4, 0],
      [4, 0],
      [-6, -8],
      [6, -8],
    ]) {
      const h = window.__coteMelvyn.sampleHeights(a.lat === undefined ? -2.4 + dx : -2.4 + dx, 44 - t * 230 + dz);
      const rise = h.visual - (h.roadY + 0.2);
      if (h.roadDist < 10.5 && rise > 0.5) {
        hits.push({
          x: -2.4 + dx,
          z: +(44 - t * 230 + dz).toFixed(1),
          rise: +rise.toFixed(3),
          roadDist: +h.roadDist.toFixed(2),
          visual: +h.visual.toFixed(3),
        });
      }
    }
  }
  return { hits: hits.slice(0, 20), count: hits.length };
});
console.log("CORRIDOR_WALLS", JSON.stringify(corridor));

const samples = await page.evaluate(() => {
  const pts = [
    [-2.2, 20],
    [-2.4, -10],
    [-2.5, -46],
    [-2.6, -82],
    [-2.4, -118],
    [-2.2, -154],
    [-2.1, -180],
    [-8, -46],
    [-12, -46],
    [4, -46],
    [8, -46],
  ];
  return pts.map(([x, z]) => {
    const h = window.__coteMelvyn.sampleHeights(x, z);
    return {
      x,
      z,
      visual: +h.visual.toFixed(3),
      roadDist: +h.roadDist.toFixed(2),
      rise: +(h.visual - (h.roadY + 0.2)).toFixed(3),
    };
  });
});
console.log("HEIGHTS", JSON.stringify(samples, null, 2));

const shots = [
  [0.1, "drive_start_ahead"],
  [0.38, "drive_mid_ahead"],
  [0.62, "drive_village_ahead"],
  [0.86, "drive_phare_ahead"],
];

for (const [t, name] of shots) {
  await page.evaluate((tt) => window.__coteMelvyn.teleportDrive(tt), t);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 90000, animations: "disabled" });
  const live = await page.evaluate(() => {
    const l = typeof window.__coteMelvyn.live === "function" ? window.__coteMelvyn.live() : window.__coteMelvyn.live;
    const s = window.__coteMelvyn.getState();
    return { mode: s.mode, car: s.carPos, yaw: s.carYaw, hud: document.body.innerText.includes("screenDeltaX") };
  });
  console.log("SHOT", name, JSON.stringify(live));
}

const dbg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await dbg.goto("http://127.0.0.1:3000/?debug=1&quality=eco", { waitUntil: "domcontentloaded", timeout: 120000 });
await waitApi(dbg);
await dbg.evaluate(() =>
  window.__coteMelvyn.setState({
    phase: "playing",
    mode: "driving",
    engineOn: true,
    loadStage: 3,
    showExplorerHint: false,
    quality: "eco",
    muted: true,
  }),
);
await dbg.waitForTimeout(2400);
const debugOn = await dbg.evaluate(() => document.body.innerText.includes("screenDeltaX"));
await dbg.screenshot({ path: `${out}/debug_flag_on.png`, timeout: 90000, animations: "disabled" });
console.log("DEBUG_FLAG", debugOn);
console.log("PAGE_ERRORS", errors.slice(0, 8));

if (debugDefault) {
  console.error("FAIL: debug HUD visible without ?debug=1");
  process.exitCode = 1;
}
if (corridor.count > 0) {
  console.error("FAIL: dirt wall in drive corridor");
  process.exitCode = 1;
}
if (!debugOn) {
  console.error("FAIL: ?debug=1 did not show overlay");
  process.exitCode = 1;
}

await browser.close();
console.log("DONE");
