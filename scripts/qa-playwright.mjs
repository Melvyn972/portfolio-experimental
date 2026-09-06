/**
 * QA script — full path smoke test for Côte Melvyn
 * Usage: node scripts/qa-playwright.mjs
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = "/opt/cursor/artifacts/screenshots";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.QA_URL || "http://localhost:3000";

async function waitPlaying(page, timeout = 20000) {
  await page.waitForFunction(
    () => window.__coteMelvyn?.getState()?.phase === "playing",
    null,
    { timeout },
  );
}

async function driveToBelvedere(page) {
  // Hold W to drive forward
  await page.keyboard.down("w");
  for (let i = 0; i < 40; i++) {
    const t = await page.evaluate(() => window.__roadT ?? 0);
    if (t > 0.48) break;
    await page.waitForTimeout(250);
  }
  await page.keyboard.up("w");
  // Brake
  await page.keyboard.down(" ");
  await page.waitForTimeout(800);
  await page.keyboard.up(" ");
}

async function desktopRun(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, "qa-desktop-boot.png") });

  await waitPlaying(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, "qa-desktop-playing.png") });

  await driveToBelvedere(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "qa-desktop-driving.png") });

  // Try exit
  const state = await page.evaluate(() => window.__coteMelvyn.getState());
  console.log("near stop:", state.nearStopSpot, "prompt:", state.prompt, "mode:", state.mode, "roadT:", await page.evaluate(() => window.__roadT));

  // Approach stop more carefully
  for (let i = 0; i < 20; i++) {
    const s = await page.evaluate(() => window.__coteMelvyn.getState());
    if (s.nearStopSpot) break;
    await page.keyboard.down("w");
    await page.waitForTimeout(200);
    await page.keyboard.up("w");
    await page.keyboard.down(" ");
    await page.waitForTimeout(300);
    await page.keyboard.up(" ");
  }

  await page.keyboard.press("e");
  await page.waitForTimeout(700);
  let after = await page.evaluate(() => window.__coteMelvyn.getState());
  console.log("after E:", after.mode, after.prompt, after.interactTarget);

  if (after.mode === "walking") {
    // Walk toward carnet — press W
    await page.keyboard.down("w");
    await page.waitForTimeout(2500);
    await page.keyboard.up("w");
    await page.keyboard.press("e");
    await page.waitForTimeout(500);
    after = await page.evaluate(() => window.__coteMelvyn.getState());
    console.log("chapter:", after.openChapter);
    await page.screenshot({ path: join(OUT, "qa-desktop-identity.png") });
    if (after.openChapter) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  } else {
    await page.screenshot({ path: join(OUT, "qa-desktop-identity.png") });
  }

  // Menu
  await page.getByRole("button", { name: /Menu/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "qa-desktop-menu.png") });
  await page.getByRole("button", { name: /Fermer/i }).click();

  // Re-enter car if walking
  after = await page.evaluate(() => window.__coteMelvyn.getState());
  if (after.mode === "walking") {
    // Walk back toward car roughly
    await page.keyboard.down("s");
    await page.waitForTimeout(2000);
    await page.keyboard.up("s");
    await page.keyboard.press("e");
    await page.waitForTimeout(600);
  }

  console.log("DESKTOP errors:", errors.filter((e) => !e.includes("favicon")).slice(0, 10));
  await page.close();
  return errors;
}

async function mobileRun(browser) {
  const iPhone = devices["iPhone 13"];
  const context = await browser.newContext({
    ...iPhone,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await waitPlaying(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, "qa-mobile-playing.png") });

  // Verify HUD sizes — joystick shouldn't dominate
  const hud = await page.evaluate(() => {
    const sticks = [...document.querySelectorAll(".pointer-events-auto.absolute")];
    return {
      stickCount: sticks.length,
      bodyH: window.innerHeight,
      bodyW: window.innerWidth,
      state: window.__coteMelvyn.getState(),
    };
  });
  console.log("MOBILE hud:", JSON.stringify(hud));

  await page.screenshot({ path: join(OUT, "qa-mobile-controls.png") });
  console.log("MOBILE errors:", errors.filter((e) => !e.includes("favicon")).slice(0, 10));
  await context.close();
  return errors;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await desktopRun(browser);
    await mobileRun(browser);
    console.log("QA done →", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
