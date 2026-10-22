// Generate dashboard HTML dari hasil Cucumber (reports/cucumber-report.json)
// Output: reports/dashboard/index.html + screenshots/, riwayat run di reports/history.json,
// dan salinan dashboard per run di reports/dashboard/runs/run-N/ supaya run lama bisa dibuka lagi
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();
const testData = require('../data/testData.json');
const { analyzeFailure } = require('./errorAnalyzer');

const ROOT = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(ROOT, 'reports/cucumber-report.json');
const HISTORY_FILE = path.join(ROOT, 'reports/history.json');
const OUT_DIR = path.join(ROOT, 'reports/dashboard');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');
const VIDEO_DIR = path.join(OUT_DIR, 'videos');
const RUNS_DIR = path.join(OUT_DIR, 'runs');
const TEMPLATE_FILE = path.join(__dirname, 'template.html');
const HISTORY_LIMIT = Number(process.env.DASHBOARD_HISTORY) || 20;

const nsToMs = ns => Math.round((ns || 0) / 1e6);
const stripAnsi = text => text.replace(/\x1b\[[0-9;]*m/g, '');

function getUserName() {
    if (process.env.REPORT_USER) return process.env.REPORT_USER;
    try {
        return execSync('git config user.name', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return os.userInfo().username;
    }
}

function scenarioStatus(steps) {
    const statuses = steps.map(s => s.result && s.result.status);
    if (statuses.some(s => ['failed', 'ambiguous', 'undefined', 'pending'].includes(s))) return 'failed';
    if (statuses.every(s => s === 'passed')) return 'passed';
    return 'skipped';
}

// Simpan screenshot step ke file supaya HTML tetap ringan
function saveScreenshot(step, fileName) {
    const image = (step.embeddings || []).find(e => e.mime_type === 'image/png');
    if (!image) return null;
    const buffer = Buffer.from(image.data, 'base64');
    fs.writeFileSync(path.join(SHOT_DIR, fileName), buffer);
    return { src: `screenshots/${fileName}`, name: fileName, sizeKb: Math.round(buffer.length / 1024) };
}

// Attachment JSON dari tests/support/world.js ({ browserLogs } dan { video })
function readJsonAttachments(step) {
    const items = [];
    for (const e of step.embeddings || []) {
        if (e.mime_type !== 'application/json') continue;
        for (const text of [e.data, Buffer.from(e.data, 'base64').toString('utf-8')]) {
            try { items.push(JSON.parse(text)); break; } catch { /* coba format berikutnya */ }
        }
    }
    return items;
}

const readBrowserLogs = step => readJsonAttachments(step).flatMap(a => a.browserLogs || []);

// Salin video scenario ke folder dashboard supaya bisa diputar langsung dari dashboard
function copyVideo(steps, index) {
    const ref = steps.flatMap(readJsonAttachments).find(a => a.video);
    if (!ref) return null;
    const source = path.resolve(ROOT, ref.video);
    if (!fs.existsSync(source)) return null;
    const fileName = `${index}.webm`;
    fs.copyFileSync(source, path.join(VIDEO_DIR, fileName));
    return { src: `videos/${fileName}`, sizeKb: Math.round(fs.statSync(source).size / 1024) };
}

const FAILED_STATUSES = ['failed', 'ambiguous', 'undefined', 'pending'];

function parseScenarios(features) {
    const scenarios = [];
    let clockMs = 0; // waktu relatif sejak run dimulai (scenario berjalan berurutan)

    features.forEach((feature, featureIndex) => {
        let backgroundSteps = [];

        for (const element of feature.elements || []) {
            if (element.type === 'background') {
                backgroundSteps = element.steps || [];
                continue;
            }

            const allSteps = [...backgroundSteps, ...(element.steps || [])];
            backgroundSteps = [];
            const index = scenarios.length + 1;
            const scenarioStart = clockMs;

            const steps = allSteps.map((s, stepIndex) => {
                const durationMs = nsToMs(s.result && s.result.duration);
                const step = {
                    keyword: s.hidden ? `${s.keyword} hook` : s.keyword.trim(),
                    name: s.name || '',
                    hook: Boolean(s.hidden),
                    status: s.result ? s.result.status : 'skipped',
                    startMs: clockMs,
                    durationMs,
                    location: s.match && s.match.location ? s.match.location : null,
                    screenshot: saveScreenshot(s, `${index}-${stepIndex + 1}.png`),
                    browserLogs: readBrowserLogs(s),
                };
                clockMs += durationMs;
                return step;
            });

            const scenario = {
                key: `${feature.uri}::${element.id}`,
                index,
                name: element.name,
                feature: feature.name,
                featureIndex,
                uri: `${feature.uri}:${element.line}`,
                tags: (element.tags || []).map(t => t.name),
                status: scenarioStatus(allSteps),
                startMs: scenarioStart,
                durationMs: clockMs - scenarioStart,
                failure: null,
                video: copyVideo(allSteps, index),
                steps,
            };

            const failedIndex = allSteps.findIndex(s => s.result && FAILED_STATUSES.includes(s.result.status));
            if (failedIndex >= 0) {
                const raw = allSteps[failedIndex].result.error_message;
                steps[failedIndex].failed = true;
                scenario.failure = {
                    stepIndex: failedIndex,
                    ...analyzeFailure({
                        raw: raw ? stripAnsi(raw) : '',
                        status: allSteps[failedIndex].result.status,
                        step: allSteps[failedIndex].hidden
                            ? { ...allSteps[failedIndex], keyword: `${allSteps[failedIndex].keyword} hook`, name: '' }
                            : allSteps[failedIndex],
                        scenario,
                        root: ROOT,
                    }),
                };
            }

            scenarios.push(scenario);
        }
    });

    return scenarios;
}

function summarize(scenarios) {
    const count = status => scenarios.filter(s => s.status === status).length;
    return {
        total: scenarios.length,
        passed: count('passed'),
        failed: count('failed'),
        skipped: count('skipped'),
        durationMs: scenarios.reduce((sum, s) => sum + s.durationMs, 0),
    };
}

function updateHistory(runAt, summary, scenarios) {
    const history = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')) : [];
    // Generate ulang untuk report yang sama → timpa entry terakhir, jangan dobel
    const last = history[history.length - 1];
    if (last && last.runAt === runAt) history.pop();

    const runNumber = history.length ? history[history.length - 1].runNumber + 1 : 1;
    history.push({
        runNumber,
        runAt,
        ...summary,
        scenarios: Object.fromEntries(scenarios.map(s => [s.key, {
            name: s.name,
            feature: s.feature,
            status: s.status,
            durationMs: s.durationMs,
            failure: s.failure && { category: s.failure.category, title: s.failure.title, summary: s.failure.summary },
        }])),
    });

    const trimmed = history.slice(-HISTORY_LIMIT);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
    return trimmed;
}

function linkIfExists(relativeFromRoot, href) {
    return fs.existsSync(path.join(ROOT, relativeFromRoot)) ? href : null;
}

const runDir = runNumber => path.join(RUNS_DIR, `run-${runNumber}`);

// Hapus salinan run yang sudah tidak ada di history (lebih lama dari HISTORY_LIMIT)
function pruneSnapshots(history) {
    if (!fs.existsSync(RUNS_DIR)) return;
    const keep = new Set(history.map(r => `run-${r.runNumber}`));
    for (const dir of fs.readdirSync(RUNS_DIR)) {
        if (!keep.has(dir)) fs.rmSync(path.join(RUNS_DIR, dir), { recursive: true, force: true });
    }
}

function renderHtml(data) {
    // Escape "<" supaya isi data tidak bisa menutup tag <script>
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    return fs.readFileSync(TEMPLATE_FILE, 'utf-8').split('__REPORT_DATA__').join(json);
}

function main() {
    if (!fs.existsSync(REPORT_FILE)) {
        console.error('reports/cucumber-report.json belum ada. Jalankan test dulu (npm test).');
        process.exit(1);
    }

    // Bersihkan dashboard terbaru, tapi simpan folder runs/ (arsip run sebelumnya)
    fs.rmSync(path.join(OUT_DIR, 'index.html'), { force: true });
    fs.rmSync(SHOT_DIR, { recursive: true, force: true });
    fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    fs.mkdirSync(VIDEO_DIR, { recursive: true });

    const features = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
    const runAt = fs.statSync(REPORT_FILE).mtime.toISOString();
    const scenarios = parseScenarios(features);
    const summary = summarize(scenarios);
    const history = updateHistory(runAt, summary, scenarios);
    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    for (const s of scenarios) {
        const prev = previous && previous.scenarios[s.key];
        s.previousDurationMs = prev ? prev.durationMs : null;
        s.previousStatus = prev ? prev.status : null;
    }

    pruneSnapshots(history);
    // Run lama yang belum punya arsip (dibuat sebelum fitur ini ada) tidak bisa dibuka
    const archived = new Set(history
        .filter(r => r.runNumber === current.runNumber || fs.existsSync(path.join(runDir(r.runNumber), 'index.html')))
        .map(r => r.runNumber));

    const base = {
        user: getUserName(),
        runNumber: current.runNumber,
        runAt,
        browser: process.env.BROWSER_NAME || 'Chromium',
        baseUrl: process.env.BASE_URL || testData.baseUrl,
        summary,
        previous: previous && {
            runNumber: previous.runNumber,
            total: previous.total,
            passed: previous.passed,
            failed: previous.failed,
            skipped: previous.skipped,
            durationMs: previous.durationMs,
        },
        history: history.map(run => ({ ...run, archived: archived.has(run.runNumber) })),
        scenarios,
    };

    // 1) Dashboard terbaru
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHtml({
        ...base,
        snapshot: false,
        paths: { runs: 'runs/', latest: null },
        links: {
            allure: linkIfExists('allure-report/index.html', '../../allure-report/index.html'),
            cucumber: linkIfExists('reports/html/index.html', '../html/index.html'),
        },
    }));

    // 2) Arsip run ini (termasuk screenshot & video). Allure/Cucumber selalu ditimpa tiap run, jadi tidak di-link dari arsip.
    const snapshotDir = runDir(current.runNumber);
    fs.rmSync(snapshotDir, { recursive: true, force: true });
    fs.mkdirSync(snapshotDir, { recursive: true });
    fs.cpSync(SHOT_DIR, path.join(snapshotDir, 'screenshots'), { recursive: true });
    fs.cpSync(VIDEO_DIR, path.join(snapshotDir, 'videos'), { recursive: true });
    fs.writeFileSync(path.join(snapshotDir, 'index.html'), renderHtml({
        ...base,
        snapshot: true,
        paths: { runs: '../', latest: '../../index.html' },
        links: { allure: null, cucumber: null },
    }));

    console.log(`Dashboard run #${current.runNumber}: ${summary.passed}/${summary.total} passed (${history.length} runs in history)`);
    console.log(`→ ${path.relative(ROOT, path.join(OUT_DIR, 'index.html'))}`);
}

main();
