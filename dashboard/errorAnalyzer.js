// Ubah pesan error mentah dari Playwright/Cucumber menjadi penjelasan yang mudah dibaca:
// jenis error, expected vs received, lokasi (file:baris) dan potongan kode.
const fs = require('fs');
const path = require('path');

const RULES = [
    {
        test: /function timed out/i,
        category: 'Timeout',
        title: 'Step took too long',
        explain: 'The step did not finish within the step time limit, so Cucumber stopped it.',
        hint: 'An action is usually stuck waiting (an element never appears, or the page hangs). Check the screenshot and the code below. If the step is just slow, raise the timeout in tests/support/world.js.',
    },
    {
        test: /intercepts pointer events/i,
        category: 'Element blocked',
        title: 'Another element is covering the target',
        explain: 'Playwright found the element but could not click it because something else (popup, modal, ad, sticky banner) is on top of it.',
        hint: 'Close or wait for the covering element to disappear before clicking. The "intercepts pointer events" line in the log shows what is covering it.',
    },
    {
        test: /toHaveText|toContainText/,
        category: 'Assertion failed',
        title: 'Text did not match',
        explain: 'The text shown on the page is different from what the test expected.',
        hint: 'Compare Expected vs Received. If the expected value is wrong, fix it in data/. If the page really shows something else, the action in the previous step probably did not work — check its screenshot.',
    },
    {
        test: /toHaveCSS/,
        category: 'Assertion failed',
        title: 'Style or size did not match',
        explain: 'A CSS value (for example width or height) is different from what the test expected.',
        hint: 'Compare Expected vs Received. For resize/drag tests, the mouse movement may have missed the handle — check the screenshot of the previous step.',
    },
    {
        test: /toHaveCount/,
        category: 'Assertion failed',
        title: 'Wrong number of elements',
        explain: 'The number of elements found by the locator is different from what the test expected.',
        hint: 'Check whether data was added/removed correctly, and whether the locator in locators/ matches only the elements you mean.',
    },
    {
        test: /toBeVisible|toBeHidden/,
        category: 'Assertion failed',
        title: 'Element visibility was wrong',
        explain: 'An element that should be visible was hidden, or one that should be hidden was still visible.',
        hint: 'Check the screenshot to see the page state, and make sure the locator points to the right element.',
    },
    {
        test: /toHaveURL/,
        category: 'Assertion failed',
        title: 'Page URL did not match',
        explain: 'The browser is on a different page than the test expected.',
        hint: 'A navigation or submit probably did not happen. Check the previous step and BASE_URL in .env.',
    },
    {
        test: /toHaveClass|toHaveAttribute|toBeChecked|toHaveValue/,
        category: 'Assertion failed',
        title: 'Element state did not match',
        explain: 'An element attribute or state is different from what the test expected.',
        hint: 'Compare Expected vs Received and check whether the action before this step really happened.',
    },
    {
        test: /net::ERR_|NS_ERROR|Navigation .*failed|page\.goto/i,
        category: 'Page load',
        title: 'Page could not be opened',
        explain: 'The browser failed to load the page.',
        hint: 'Check your internet connection, whether the site is up, and BASE_URL in .env.',
    },
    {
        test: /Timeout \d+ms exceeded/i,
        category: 'Element not ready',
        title: 'Element could not be used in time',
        explain: 'Playwright waited for an element to be ready (visible, enabled, stable) but it never was.',
        hint: 'The selector in locators/ may be wrong or outdated, or the element is hidden/disabled. The "waiting for" line in the log shows which locator it was waiting for.',
    },
    {
        test: /ENOENT|no such file/i,
        category: 'Test data',
        title: 'File not found',
        explain: 'The test tried to read a file that does not exist.',
        hint: 'Check the file name used in the feature file and make sure it exists in data/.',
    },
    {
        test: /expect\(/,
        category: 'Assertion failed',
        title: 'Check did not pass',
        explain: 'A verification in the test did not pass.',
        hint: 'Compare Expected vs Received below.',
    },
];

const STATUS_RULES = {
    undefined: {
        category: 'Missing step',
        title: 'No step definition found',
        explain: 'This step in the feature file has no matching code in tests/steps/.',
        hint: 'Add a step definition with exactly the same text, or fix a typo in the feature file.',
    },
    ambiguous: {
        category: 'Duplicate step',
        title: 'More than one step definition matches',
        explain: 'Cucumber found several step definitions for this step and does not know which one to use.',
        hint: 'Make the step texts in tests/steps/ unique.',
    },
    pending: {
        category: 'Pending step',
        title: 'Step is not implemented yet',
        explain: 'The step definition exists but is marked as pending.',
        hint: 'Implement the step in tests/steps/.',
    },
};

const DEFAULT_RULE = {
    category: 'Code error',
    title: 'Unexpected error in test code',
    explain: 'An error was thrown while running this step.',
    hint: 'Read the first line of the error and go to the code location below.',
};

const pick = (text, regex) => {
    const m = text.match(regex);
    return m ? m[1].trim() : null;
};

function parseFrames(raw, root) {
    const frames = [];
    const re = /^\s*at (?:(.+?) \()?((?:\/|[A-Za-z]:\\)[^()\n]+?):(\d+):(\d+)\)?\s*$/gm;
    let m;
    while ((m = re.exec(raw))) {
        const file = m[2];
        if (!file.startsWith(root) || file.includes('node_modules')) continue;
        frames.push({ fn: m[1] || null, file: path.relative(root, file), line: Number(m[3]), col: Number(m[4]) });
    }
    return frames;
}

function readSnippet(root, file, line, before = 3, after = 2) {
    try {
        const lines = fs.readFileSync(path.join(root, file), 'utf-8').split(/\r?\n/);
        const start = Math.max(1, line - before);
        const end = Math.min(lines.length, line + after);
        return { file, line, startLine: start, lines: lines.slice(start - 1, end) };
    } catch {
        return null;
    }
}

function frameLabel(file) {
    if (file.startsWith('pages/')) return 'Page object';
    if (file.startsWith('locators/')) return 'Locator';
    if (file.startsWith('tests/steps/')) return 'Step definition';
    if (file.startsWith('tests/support/')) return 'Support / hook';
    return 'Code';
}

function analyzeFailure({ raw, status, step, scenario, root }) {
    const text = raw || '';
    const rule = STATUS_RULES[status] || RULES.find(r => r.test.test(text)) || DEFAULT_RULE;
    const firstLine = text.split('\n').map(l => l.trim()).find(Boolean) || `Step ${status}`;

    const expected = pick(text, /^\s*Expected(?: string| pattern| value)?:\s*(.+)$/m);
    const received = pick(text, /^\s*Received(?: string| value)?:\s*(.+)$/m);
    const locator = pick(text, /^\s*Locator:\s*(.+)$/m) || pick(text, /waiting for (locator\(.+?\)|getBy\w+\(.+?\))\s*$/m);
    const timeout = pick(text, /Timeout:?\s*(\d+ms)/) || pick(text, /within (\d+ milliseconds)/);
    const covering = pick(text, /^\s*-\s*(.+?) intercepts pointer events/m);

    let summary = firstLine.replace(/^Error:\s*/, '');
    if (expected != null && received != null) summary = `Expected ${expected}, but got ${received}`;
    else if (covering) summary = `Blocked by ${covering}`;
    else if (status === 'undefined') summary = `No code found for "${step.keyword} ${step.name}"`;

    // Lokasi: feature → step → step definition → page object (dari stack trace)
    const frames = parseFrames(text, root);
    const stepDef = step.match && step.match.location ? step.match.location.match(/^(.+):(\d+)$/) : null;
    const where = [
        { label: 'Feature', file: scenario.uri.replace(/:\d+$/, ''), line: Number(scenario.uri.split(':').pop()) },
        { label: 'Step', text: `${step.keyword} ${step.name}`.trim() },
    ];
    if (stepDef) where.push({ label: 'Step definition', file: stepDef[1], line: Number(stepDef[2]) });
    for (const f of frames) {
        if (where.some(w => w.file === f.file && w.line === f.line)) continue;
        if (stepDef && f.file === stepDef[1]) continue;
        where.push({ label: frameLabel(f.file), file: f.file, line: f.line, fn: f.fn });
    }

    // Potongan kode di titik paling dalam (biasanya page object), kalau tidak ada pakai step definition
    const deepest = frames[0] || (stepDef && { file: stepDef[1], line: Number(stepDef[2]) });
    const snippet = deepest ? readSnippet(root, deepest.file, deepest.line) : null;

    return {
        category: rule.category,
        title: rule.title,
        explain: rule.explain,
        hint: rule.hint,
        summary,
        expected,
        received,
        locator,
        timeout,
        where,
        snippet,
        raw: text || summary,
    };
}

module.exports = { analyzeFailure };
