import { chromium } from 'playwright';

const errors = [];
const logs = [];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (msg) => {
  const t = msg.type();
  const text = msg.text();
  if (t === 'error') errors.push(text);
  if (t === 'warning' || t === 'error') logs.push(`[${t}] ${text.slice(0, 200)}`);
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/qa-boot.png', fullPage: false });

// Wait for playing phase
for (let i = 0; i < 20; i++) {
  const phase = await page.evaluate(() => window.__coteMelvyn?.getState?.()?.phase);
  console.log('phase', phase);
  if (phase === 'playing') break;
  await page.waitForTimeout(500);
}

await page.click('canvas', { force: true }).catch(() => {});
await page.waitForTimeout(300);

const before = await page.evaluate(() => {
  const s = window.__coteMelvyn.getState();
  return { phase: s.phase, mode: s.mode, car: s.carPos, speed: s.speed };
});
console.log('before', JSON.stringify(before));

// Hold W for 3s
await page.keyboard.down('w');
await page.waitForTimeout(3000);
await page.keyboard.up('w');
await page.waitForTimeout(200);

const after = await page.evaluate(() => {
  const s = window.__coteMelvyn.getState();
  return { phase: s.phase, mode: s.mode, car: s.carPos, speed: s.speed, roadT: window.__roadT };
});
console.log('after', JSON.stringify(after));

await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/qa-drive.png' });

// Teleport near belvedere and exit
await page.evaluate(() => {
  const api = window.__coteMelvyn;
  // Force near stop by setting state - better: move via internal if exposed
  api.setState({ phase: 'playing', mode: 'walking', showExplorerHint: false });
});
await page.waitForTimeout(500);
const walk = await page.evaluate(() => window.__coteMelvyn.getState());
console.log('walk mode', walk.mode, walk.playerPos);

await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/qa-walk-force.png' });

// Open menu
await page.getByRole('button', { name: /Menu/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/qa-menu.png' });

// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.__coteMelvyn.setState({ rescueOpen: false, openChapter: null }));
await page.waitForTimeout(500);
await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/qa-mobile.png' });

console.log('ERRORS', errors.length ? errors : 'none');
console.log('LOGS', logs.slice(0, 15));
await browser.close();

const moved = Math.hypot(after.car.x - before.car.x, after.car.z - before.car.z);
console.log('MOVED_DISTANCE', moved);
process.exit(moved > 1 ? 0 : 2);
