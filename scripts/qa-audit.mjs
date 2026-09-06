import { chromium, devices } from "playwright";
import fs from "fs";

const OUT = "/tmp/qa-out";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync("/opt/cursor/artifacts/qa", { recursive: true });

const SECTIONS = [
  "Entrée",
  "Profil",
  "Parcours",
  "Compétences",
  "Projets",
  "Passions",
  "CV",
  "Contact",
];

async function enter(page) {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  const btn = page.getByRole("button", { name: /Entrer dans l'atelier|Initialisation/i });
  await btn.waitFor({ timeout: 45000 });
  for (let i = 0; i < 50; i++) {
    const t = await btn.innerText();
    const disabled = await btn.isDisabled();
    if (!/Initialisation/i.test(t) && !disabled) break;
    await page.waitForTimeout(400);
  }
  await btn.click({ force: true });
  await page.waitForTimeout(2800);
}

async function go(page, label) {
  await page.evaluate((name) => {
    const buttons = [...document.querySelectorAll("button")];
    const b = buttons.find(
      (el) =>
        (el.getAttribute("aria-label") || "").includes(`Aller à ${name}`) ||
        (el.getAttribute("aria-label") || "").includes(name) ||
        (el.textContent || "").includes(name),
    );
    if (b) b.click();
  }, label);
  await page.waitForTimeout(1300);
}

async function metrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const overflowX = Math.max(doc.scrollWidth, body.scrollWidth) > window.innerWidth + 2;
    const canvas = document.querySelector("canvas");
    const canvasOk = !!canvas && canvas.width > 0 && canvas.height > 0;
    const visibleSections = [...document.querySelectorAll("section[aria-hidden]")]
      .filter((s) => s.getAttribute("aria-hidden") === "false")
      .map((s) => s.querySelector("h2")?.textContent?.trim() || "section");
    const overlaysBlocking = (() => {
      // count opacity-0 panels that still have pointer-events-auto descendants
      let bad = 0;
      document.querySelectorAll("section[aria-hidden='true']").forEach((sec) => {
        const style = getComputedStyle(sec);
        if (style.opacity === "0" || sec.getAttribute("aria-hidden") === "true") {
          if (sec.querySelector(".pointer-events-auto, button, a, input")) {
            // check if section itself blocks
            const pe = style.pointerEvents;
            if (pe !== "none") bad++;
          }
        }
      });
      return bad;
    })();
    const tapTargets = [...document.querySelectorAll("nav[aria-label='Sections'] button")].map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), label: b.textContent?.trim() };
    });
    const smallTaps = tapTargets.filter((t) => t.h < 40 || t.w < 40);
    const form = {
      name: !!document.querySelector('input[name="name"]'),
      email: !!document.querySelector('input[name="email"]'),
      message: !!document.querySelector('textarea[name="message"]'),
      submit: !!document.querySelector('button[type="submit"]'),
    };
    return {
      overflowX,
      canvasOk,
      canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
      visibleSections,
      overlaysBlocking,
      tapTargets,
      smallTaps,
      form,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
}

async function auditViewport(name, options) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const logs = [];
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  const report = { name, steps: [], issues: [], logs };

  // Entrance
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}-00-loader.png` });
  report.steps.push("loader");

  await enter(page);
  await page.screenshot({ path: `${OUT}/${name}-01-entered.png` });
  let m = await metrics(page);
  if (!m.canvasOk) report.issues.push("WebGL canvas missing/zero size after enter");
  if (m.overflowX) report.issues.push("Horizontal overflow after enter");
  report.steps.push({ entered: m });

  // Walk all sections
  for (let i = 0; i < SECTIONS.length; i++) {
    const label = SECTIONS[i];
    await go(page, label);
    await page.screenshot({ path: `${OUT}/${name}-sec-${String(i + 1).padStart(2, "0")}-${label}.png` });
    m = await metrics(page);
    if (m.overflowX) report.issues.push(`Overflow X on ${label}`);
    // Check visible heading roughly matches
    const visible = (m.visibleSections || []).join(" | ");
    report.steps.push({ section: label, visible, canvasOk: m.canvasOk });
  }

  // Contact form usability
  await go(page, "Contact");
  m = await metrics(page);
  if (!m.form.name || !m.form.email || !m.form.message || !m.form.submit) {
    report.issues.push("Contact form incomplete");
  }
  // Try fill
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.count()) {
    await nameInput.fill("Test QA");
    await page.locator('input[name="email"]').fill("qa@example.com");
    await page.locator('textarea[name="message"]').fill("Mission test portfolio");
    await page.screenshot({ path: `${OUT}/${name}-contact-filled.png` });
  } else {
    report.issues.push("Cannot fill contact form — inputs not found/interactable");
  }

  // Quality toggle
  const select = page.locator('select[aria-label="Qualité du rendu 3D"]');
  if (await select.count()) {
    await select.selectOption("low");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}-quality-eco.png` });
    await select.selectOption("high");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}-quality-high.png` });
  } else if (name === "desktop") {
    report.issues.push("Quality toggle missing on desktop");
  }

  // Embaucher CTA
  const hire = page.getByRole("button", { name: /Embaucher/i });
  if (await hire.count()) {
    await hire.click();
    await page.waitForTimeout(1000);
    m = await metrics(page);
    report.steps.push({ hireJump: m.visibleSections });
  }

  // CV page
  await page.goto("http://localhost:3000/cv", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-cv-page.png`, fullPage: true });
  const pdfStatus = await page.evaluate(async () => {
    const r = await fetch("/cv-melvyn-thierry-bellefond.pdf", { method: "HEAD" });
    return r.status;
  });
  if (pdfStatus !== 200) report.issues.push(`PDF download status ${pdfStatus}`);
  const cvBack = page.getByRole("link", { name: /atelier/i });
  if (!(await cvBack.count())) report.issues.push("CV missing back link");

  // Mobile-specific: tap targets + swipe
  if (name === "mobile") {
    await enter(page);
    m = await metrics(page);
    if (m.smallTaps.length) {
      report.issues.push(`Small tap targets: ${JSON.stringify(m.smallTaps)}`);
    }
    // Check all 8 rail buttons exist
    const railCount = await page.locator("nav[aria-label='Sections'] button").count();
    if (railCount < 8) report.issues.push(`Mobile rail only ${railCount}/8 sections`);
    // Swipe up to next section
    const before = await page.evaluate(() => document.querySelector('[aria-current="true"]')?.textContent);
    await page.touchscreen.tap(200, 400);
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true }));
    });
    // Playwright swipe via mouse drag equivalent for touch
    await page.mouse.move(200, 600);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 12 });
    await page.mouse.up();
    // Better: use touch events through CDP-ish locator
    await page.evaluate(() => {
      const start = new Event("touchstart", { bubbles: true });
      // fallback: click next rail button
    });
    await go(page, "Profil");
    await page.screenshot({ path: `${OUT}/${name}-after-nav.png` });

    // Safe area / bottom rail not covering CTA badly — check contact submit above rail
    await go(page, "Contact");
    const layout = await page.evaluate(() => {
      const submit = document.querySelector('button[type="submit"]');
      const rail = document.querySelector("nav[aria-label='Sections']");
      if (!submit || !rail) return null;
      const s = submit.getBoundingClientRect();
      const r = rail.getBoundingClientRect();
      return {
        submitBottom: s.bottom,
        railTop: r.top,
        overlaps: s.bottom > r.top - 8,
        submitHeight: s.height,
      };
    });
    report.steps.push({ contactVsRail: layout });
    if (layout?.overlaps) report.issues.push("Contact submit overlaps mobile rail");
    await page.screenshot({ path: `${OUT}/${name}-contact-vs-rail.png` });
  }

  // Desktop wheel nav
  if (name === "desktop") {
    await enter(page);
    await go(page, "Entrée");
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${name}-after-wheel.png` });
    // Hover rail
    const railBtn = page
      .locator('nav[aria-label="Navigation de l\'atelier"]')
      .getByLabel("Aller à Projets");
    if (await railBtn.count()) {
      await railBtn.hover();
      await railBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/${name}-rail-projets.png` });
    }
  }

  // Reduced motion
  await context.close();
  const rmContext = await browser.newContext({
    ...options,
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(800);
  const rmBtn = rmPage.getByRole("button", { name: /Entrer/i });
  await rmBtn.click({ force: true });
  await rmPage.waitForTimeout(1500);
  await rmPage.screenshot({ path: `${OUT}/${name}-reduced-motion.png` });
  const hasCanvas = await rmPage.locator("canvas").count();
  const hasFallback = await rmPage.getByText(/Mode confort|sans WebGL/i).count();
  report.steps.push({ reducedMotion: { hasCanvas, hasFallback } });
  if (!hasFallback && hasCanvas === 0) report.issues.push("Reduced motion: no canvas and no fallback visible");
  await rmContext.close();

  report.logs = logs.slice(-40);
  fs.writeFileSync(`${OUT}/${name}-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  return report;
}

const desktop = await auditViewport("desktop", { viewport: { width: 1440, height: 900 } });
const mobile = await auditViewport("mobile", {
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

console.log(JSON.stringify({
  desktopIssues: desktop.issues,
  mobileIssues: mobile.issues,
  desktopLogErrors: desktop.logs.filter((l) => /error|pageerror/i.test(l)).slice(0, 15),
  mobileLogErrors: mobile.logs.filter((l) => /error|pageerror/i.test(l)).slice(0, 15),
}, null, 2));
