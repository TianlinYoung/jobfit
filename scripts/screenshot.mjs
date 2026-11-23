// Takes a full-page PNG of the running dev server with sample data loaded (for the README).
//
// Needs: Node 22+ (built-in fetch and WebSocket), a local Chrome or Edge, and `npm run dev` running.
// No npm dependencies: it drives the browser through the Chrome DevTools Protocol directly.
//
// Usage:
//   node scripts/screenshot.mjs --view match --lang en --width 1280 --out docs/screenshots/match-en.png
//   node scripts/screenshot.mjs --view board --lang zh --out board-zh.png
// Options: --view match|board   --lang en|zh   --width <css px>   --out <file>
//          --url (default http://localhost:5173)   BROWSER_PATH env var to choose the browser.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATE_BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
];
const DEBUG_PORT = 9333;

const options = parseArgs(process.argv.slice(2));
const browserPath = process.env.BROWSER_PATH ?? CANDIDATE_BROWSERS.find((path) => existsSync(path));
if (browserPath === undefined) {
  fail('No Chrome or Edge found. Set BROWSER_PATH to your browser executable.');
}

// A throwaway profile, so the screenshot never touches your real browser data.
const profileDir = mkdtempSync(join(tmpdir(), 'jobfit-screenshot-'));
const browser = spawn(browserPath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  'about:blank',
]);

try {
  const page = await connectToPage();
  await page.send('Emulation.setDeviceMetricsOverride', viewport(options.width, 900));
  await page.send('Page.navigate', { url: options.url });
  await sleep(1500);
  // Start clean in the requested language (this only affects the throwaway profile).
  await page.evaluate(`localStorage.clear(); localStorage.setItem('jobfit.language', '${options.lang}'); location.reload();`);
  await sleep(1500);
  await page.evaluate(scriptForView(options.view));
  await sleep(800);

  const height = await page.evaluate('document.documentElement.scrollHeight');
  await page.send('Emulation.setDeviceMetricsOverride', viewport(options.width, height));
  await sleep(500);
  const shot = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(options.out, Buffer.from(shot.data, 'base64'));
  console.log(`Saved ${options.out} (${options.width} x ${height} CSS px, 2x resolution)`);
  page.close();
} finally {
  browser.kill();
  await sleep(300);
  rmSync(profileDir, { recursive: true, force: true });
}

/** Clicks that put the page into the state we want to capture. */
function scriptForView(view) {
  if (view === 'match') {
    return `document.querySelector('#try-sample').click()`;
  }
  if (view === 'board') {
    return `document.querySelector('#tab-board').click();
            setTimeout(() => document.querySelector('#load-sample-applications').click(), 300);`;
  }
  fail(`Unknown --view "${view}" (use match or board)`);
}

function viewport(width, height) {
  return { width, height, deviceScaleFactor: 2, mobile: false };
}

async function connectToPage() {
  let targets;
  for (let attempt = 0; attempt < 50 && targets === undefined; attempt++) {
    await sleep(200);
    try {
      targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
    } catch {
      // Browser not ready yet; try again.
    }
  }
  const target = targets?.find((t) => t.type === 'page');
  if (target === undefined) {
    fail('Could not connect to the headless browser.');
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve));

  let nextId = 1;
  const waiting = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (waiting.has(message.id)) {
      waiting.get(message.id)(message.result);
      waiting.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = nextId++;
      waiting.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  return { send, evaluate, close: () => socket.close() };
}

function parseArgs(args) {
  const result = { view: 'match', lang: 'en', width: 1280, out: 'screenshot.png', url: 'http://localhost:5173/' };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (!(key in result) || value === undefined) {
      fail(`Unknown or incomplete option: ${args[i]}`);
    }
    result[key] = key === 'width' ? Number(value) : value;
  }
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
