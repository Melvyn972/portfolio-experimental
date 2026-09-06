import { chromium } from "playwright";
import fs from "fs";

const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const badAssets = [];
page.on("console", (m) => {
  if (m.type() === "error") console.log("[error]", m.text().slice(0, 200));
});
page.on("response", (r) => {
  if (r.url().includes("/models/") && r.status() >= 400) badAssets.push(`${r.status()} ${r.url()}`);
});

await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded", timeout: 120000 });
for (let i = 0; i < 60; i++) {
  if (await page.evaluate(() => Boolean(window.__coteMelvyn?.teleportWalk))) break;
  await page.waitForTimeout(500);
}
await page.evaluate(() => {
  window.__coteMelvyn.setState({ phase: "playing", engineOn: true, showExplorerHint: false, loadStage: 3 });
});
await page.waitForSelector("canvas", { timeout: 60000 });
await page.waitForTimeout(5000);

await page.screenshot({ path: `${outDir}/qa-art-start.png` });

await page.click("canvas", { force: true }).catch(() => {});
await page.keyboard.down("w");
await page.waitForTimeout(2000);
await page.keyboard.up("w");
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/qa-art-drive.png` });

await page.evaluate(() => window.__coteMelvyn.teleportBelvedere());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/qa-art-belvedere.png` });
const desc = page.getByRole("button", { name: /Descendre/i });
if (await desc.count()) await desc.first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/qa-art-walk.png` });

// Maison — stand back looking at building
await page.evaluate(() => window.__coteMelvyn.teleportWalk(5, 0.25, -42, Math.PI / 2));
await page.waitForTimeout(2200);
await page.screenshot({ path: `${outDir}/qa-art-maison.png` });

await page.evaluate(() => window.__coteMelvyn.teleportWalk(7, 0.35, -118, Math.PI / 2));
await page.waitForTimeout(2200);
await page.screenshot({ path: `${outDir}/qa-art-studio.png` });

await page.evaluate(() => window.__coteMelvyn.teleportWalk(4, 0.45, -165, -0.2));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/qa-art-phare.png` });

const st = await page.evaluate(() => window.__coteMelvyn.getState());
console.log("player", st.playerPos, "mode", st.mode);
console.log("BAD_ASSETS", badAssets.length ? badAssets : "none");
await browser.close();
