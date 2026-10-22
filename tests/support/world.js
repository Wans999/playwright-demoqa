const { setWorldConstructor, World, Before, After, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { chromium } = require('playwright');

const isCI = process.env.CI === 'true';
// Jeda (ms) untuk memperlambat test supaya mudah diamati. Di CI default 0 (tanpa jeda).
const SLOW_MO = Number(process.env.SLOW_MO ?? (isCI ? 0 : 1000));      // jeda tiap aksi (klik, ketik, drag)
const STEP_DELAY = Number(process.env.STEP_DELAY ?? (isCI ? 0 : 2000)); // jeda setelah tiap step

// Batas waktu per step ikut membesar sesuai jeda, supaya step panjang (misal bulk insert) tidak timeout
setDefaultTimeout(SLOW_MO > 0 ? 120000 + SLOW_MO * 100 : 30000);

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
    this.browserLogs = [];
  }
}

// Error karena request iklan yang sengaja diblokir bukan masalah aplikasi, jadi diabaikan
const isBlockedAdNoise = text => /ERR_FAILED|ERR_BLOCKED|advertisement|GPT script|googletag|adplus/i.test(text);

setWorldConstructor(PlaywrightWorld);

Before(async function () {
  this.browser = await chromium.launch({ headless: isCI, slowMo: SLOW_MO });
  this.context = await this.browser.newContext({
    recordVideo: {
      dir: 'videos/',
      size: { width: 1280, height: 720 }
    }
  });
  // Blokir iklan supaya tidak menutupi elemen dan memperlambat test
  await this.context.route(/googlesyndication|doubleclick|adplus|adservice|googletagservices|amazon-adsystem/, route => route.abort());
  this.page = await this.context.newPage();

  // Kumpulkan error/warning dari console browser & error JavaScript halaman
  this.page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type()) && !isBlockedAdNoise(msg.text())) {
      this.browserLogs.push({ type: msg.type(), text: msg.text() });
    }
  });
  this.page.on('pageerror', err => this.browserLogs.push({ type: 'pageerror', text: err.message }));
});

AfterStep(async function () {
  const screenshot = await this.page.screenshot();
  await this.attach(screenshot, 'image/png');
  if (this.browserLogs.length) {
    await this.attach(JSON.stringify({ browserLogs: this.browserLogs }), 'application/json');
    this.browserLogs = [];
  }
  if (STEP_DELAY > 0) await this.page.waitForTimeout(STEP_DELAY);
});

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

After(async function ({ pickle }) {
  await this.page.waitForTimeout(1000);
  const video = this.page.video();
  // Video baru selesai ditulis setelah context ditutup
  await this.context.close();
  await this.browser.close();

  if (video) {
    // Ganti nama acak (page@xxxx.webm) jadi nama scenario, lalu catat path-nya untuk dashboard
    const rawPath = await video.path();
    const target = path.join(path.dirname(rawPath), `${slugify(pickle.name)}-${Date.now()}.webm`);
    fs.renameSync(rawPath, target);
    await this.attach(JSON.stringify({ video: path.relative(process.cwd(), target) }), 'application/json');
  }
});