// Jalankan test Cucumber, lalu SELALU generate dashboard (juga saat ada test yang gagal),
// lalu buka dashboard di browser (hanya di lokal, tidak di CI).
//
// Pemakaian:
//   node run-tests.js                     → semua test
//   node run-tests.js --tags @webtables   → argumen lain diteruskan ke cucumber-js
//   node run-tests.js --allure            → sekalian kumpulkan & generate Allure report
//
// Env:
//   DASHBOARD_OPEN=false  → jangan buka browser otomatis
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const ROOT = __dirname;
const REPORT_FILE = path.join(ROOT, 'reports/cucumber-report.json');
const DASHBOARD_FILE = path.join(ROOT, 'reports/dashboard/index.html');
const isCI = process.env.CI === 'true';
const isWindows = process.platform === 'win32';

const args = process.argv.slice(2);
const withAllure = args.includes('--allure');
const cucumberArgs = args.filter(a => a !== '--allure');

const bin = name => path.join(ROOT, 'node_modules', '.bin', isWindows ? `${name}.cmd` : name);
const run = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: isWindows }).status ?? 1;
const mtime = file => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0);

function openInBrowser(file) {
    const [cmd, cmdArgs] = isWindows ? ['cmd', ['/c', 'start', '""', file]]
        : process.platform === 'darwin' ? ['open', [file]]
        : ['xdg-open', [file]];
    try {
        spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' }).unref();
    } catch {
        console.log(`Buka manual: ${file}`);
    }
}

// 1) Test
if (withAllure) {
    fs.rmSync(path.join(ROOT, 'allure-results'), { recursive: true, force: true });
    cucumberArgs.push('--format', 'allure-cucumberjs/reporter', '--format-options', '{"resultsDir":"allure-results"}');
}
const reportBefore = mtime(REPORT_FILE);
const testStatus = run(bin('cucumber-js'), cucumberArgs);

// 2) Allure (opsional)
if (withAllure) {
    run(bin('allure'), ['generate', 'allure-results', '--clean', '--single-file', '-o', 'allure-report']);
}

// 3) Dashboard — hanya kalau test benar-benar menghasilkan report baru
//    (kalau cucumber crash sebelum jalan, jangan tampilkan dashboard lama seolah-olah hasil baru)
if (mtime(REPORT_FILE) === reportBefore) {
    console.error('\nTest tidak menghasilkan report baru, dashboard tidak di-generate.');
} else {
    console.log('\nGenerating dashboard...');
    const dashboardStatus = run(process.execPath, [path.join(ROOT, 'dashboard', 'generate.js')]);
    if (dashboardStatus === 0 && !isCI && process.env.DASHBOARD_OPEN !== 'false') {
        openInBrowser(DASHBOARD_FILE);
    }
}

// Exit code tetap mengikuti hasil test, supaya Jenkins tetap tahu kalau ada test yang gagal
process.exit(testStatus);
