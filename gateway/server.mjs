import { createServer, request as httpRequest } from 'node:http';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import httpProxy from 'http-proxy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 10000);
const BIBLE_PORT = Number(process.env.BIBLE_INTERNAL_PORT || 4100);
const NPAT_PORT = Number(process.env.NPAT_INTERNAL_PORT || 4200);

const bibleServerDir = path.join(rootDir, 'apps', 'bibletimeline', 'server');
const bibleFrontendBuild = path.join(rootDir, 'apps', 'bibletimeline', 'frontend', 'build');
const npatDir = path.join(rootDir, 'apps', 'nameplaceanimalthing');
const npatBuildDir = path.join(npatDir, '.next');
const UPSTREAM_READY_TIMEOUT_MS = 30000;
const UPSTREAM_RETRY_DELAY_MS = 500;

let isShuttingDown = false;
let shutdownPromise = null;
let isGatewayReady = false;

const runChild = (command, args, options) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(options.env || {})
    }
  });

  child.exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${options.name} exited with code ${code}`);
    }

    if (!isShuttingDown) {
      void shutdown(1);
    }
  });

  return child;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const probeUpstream = (port, requestPath = '/health') => {
  return new Promise((resolve) => {
    const request = httpRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: requestPath,
        method: 'GET',
        timeout: 2000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 300);
      },
    );

    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.end();
  });
};

const waitForUpstream = async (name, port, requestPath = '/health') => {
  const deadline = Date.now() + UPSTREAM_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const isReady = await probeUpstream(port, requestPath);
    if (isReady) {
      return;
    }

    await wait(UPSTREAM_RETRY_DELAY_MS);
  }

  throw new Error(`${name} did not become ready in time`);
};

if (!existsSync(bibleFrontendBuild)) {
  console.warn('Bible Timeline build not found. Run: npm run build');
}

if (!existsSync(npatBuildDir)) {
  console.warn('NamePlaceAnimalThing build not found. Run: npm run build');
}

const bibleProcess = runChild('npm', ['run', 'start'], {
  cwd: bibleServerDir,
  env: { PORT: String(BIBLE_PORT), NODE_ENV: 'production' },
  name: 'BibleTimeline server'
});

const npatProcess = runChild('npm', ['run', 'start'], {
  cwd: npatDir,
  env: { PORT: String(NPAT_PORT), NODE_ENV: 'production' },
  name: 'NamePlaceAnimalThing server'
});

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  xfwd: true
});

proxy.on('error', (error, req, res) => {
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Upstream unavailable', detail: String(error.message || error) }));
    return;
  }

  if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

const launchPageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Church Games</title>
    <meta
      name="description"
      content="Launch Bible Timeline or Name Place Animal Thing from one simple church games homepage."
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0a1220;
        --panel: rgba(255, 255, 255, 0.04);
        --line: rgba(255, 255, 255, 0.12);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.78);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(125, 211, 252, 0.12), transparent 30%),
          linear-gradient(180deg, #111b2d 0%, var(--bg) 55%, #050913 100%);
        color: var(--text);
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      }

      main {
        width: min(760px, 100%);
      }

      .frame {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: var(--panel);
        backdrop-filter: blur(14px);
        padding: 36px;
      }

      .eyebrow {
        margin: 0;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h1 {
        margin: 12px 0 0;
        font-size: clamp(2.6rem, 9vw, 4.6rem);
        line-height: 0.95;
        letter-spacing: -0.05em;
      }

      .intro {
        margin: 18px 0 0;
        max-width: 38rem;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .games {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 32px;
      }

      .game {
        display: block;
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.03);
        color: inherit;
        text-decoration: none;
        transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
      }

      .game:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.22);
      }

      .game:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 4px;
      }

      .game-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .arrow {
        color: var(--muted);
        font-size: 1.1rem;
      }

      .game-copy {
        margin: 10px 0 0;
        color: var(--muted);
        line-height: 1.6;
        font-size: 0.95rem;
      }

      .footer {
        margin-top: 18px;
        color: rgba(226, 232, 240, 0.58);
        font-size: 0.84rem;
      }

      @media (max-width: 720px) {
        body {
          padding: 16px;
        }

        .frame {
          padding: 24px;
          border-radius: 22px;
        }

        .games {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="frame">
        <p class="eyebrow">Church Games</p>
        <h1>Choose a game.</h1>
        <p class="intro">
          A simple launcher for your group. Pick the Bible challenge or the party game and start playing.
        </p>

        <div class="games" aria-label="Available games">
          <a class="game" href="/bibletimeline">
            <div class="game-title">
              <span>Bible Timeline</span>
              <span class="arrow" aria-hidden="true">&rarr;</span>
            </div>
            <p class="game-copy">Order key events across scripture in solo or PvP play.</p>
          </a>

          <a class="game" href="/nameplaceanimalthing">
            <div class="game-title">
              <span>Name Place Animal Thing</span>
              <span class="arrow" aria-hidden="true">&rarr;</span>
            </div>
            <p class="game-copy">Fast multiplayer category rounds with live scoring.</p>
          </a>
        </div>

        <p class="footer">One launcher, two games.</p>
      </section>
    </main>
  </body>
</html>`;

const rewritePath = (req, prefix) => {
  const original = req.url || '/';
  const next = original.replace(prefix, '') || '/';
  req.url = next.startsWith('/') ? next : `/${next}`;
};

const server = createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (requestPath === '/health') {
    res.writeHead(isGatewayReady ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: isGatewayReady }));
    return;
  }

  if (!isGatewayReady) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Upstreams are still starting' }));
    return;
  }

  if (requestPath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(launchPageHtml);
    return;
  }

  if (requestPath.startsWith('/bibletimeline/socket.io')) {
    rewritePath(req, '/bibletimeline');
    proxy.web(req, res, { target: `http://127.0.0.1:${BIBLE_PORT}` });
    return;
  }

  if (requestPath.startsWith('/nameplaceanimalthing/socket.io')) {
    rewritePath(req, '/nameplaceanimalthing');
    proxy.web(req, res, { target: `http://127.0.0.1:${NPAT_PORT}` });
    return;
  }

  if (requestPath.startsWith('/bibletimeline')) {
    rewritePath(req, '/bibletimeline');
    proxy.web(req, res, { target: `http://127.0.0.1:${BIBLE_PORT}` });
    return;
  }

  if (requestPath.startsWith('/nameplaceanimalthing')) {
    proxy.web(req, res, { target: `http://127.0.0.1:${NPAT_PORT}` });
    return;
  }

  if (requestPath.startsWith('/_next') || requestPath.startsWith('/api/')) {
    proxy.web(req, res, { target: `http://127.0.0.1:${NPAT_PORT}` });
    return;
  }

  res.writeHead(302, { Location: '/' });
  res.end();
});

server.on('upgrade', (req, socket, head) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (!isGatewayReady) {
    socket.destroy();
    return;
  }

  if (requestPath.startsWith('/bibletimeline/socket.io')) {
    rewritePath(req, '/bibletimeline');
    proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${BIBLE_PORT}` });
    return;
  }

  if (requestPath.startsWith('/nameplaceanimalthing/socket.io')) {
    rewritePath(req, '/nameplaceanimalthing');
    proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${NPAT_PORT}` });
    return;
  }

  if (requestPath.startsWith('/bibletimeline')) {
    rewritePath(req, '/bibletimeline');
    proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${BIBLE_PORT}` });
    return;
  }

  if (requestPath.startsWith('/nameplaceanimalthing')) {
    proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${NPAT_PORT}` });
    return;
  }

  socket.destroy();
});

const terminateChild = async (child, name) => {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  const result = await Promise.race([
    child.exitPromise,
    wait(5000).then(() => null)
  ]);

  if (!result && child.exitCode === null) {
    console.warn(`${name} did not exit after SIGTERM; forcing shutdown`);
    child.kill('SIGKILL');
    await child.exitPromise;
  }
};

const shutdown = async (exitCode = 0) => {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  isShuttingDown = true;
  isGatewayReady = false;

  shutdownPromise = (async () => {
    await Promise.allSettled([
      terminateChild(bibleProcess, 'BibleTimeline server'),
      terminateChild(npatProcess, 'NamePlaceAnimalThing server')
    ]);

    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    process.exit(exitCode);
  })();

  return shutdownPromise;
};

process.on('SIGINT', () => {
  void shutdown(0);
});
process.on('SIGTERM', () => {
  void shutdown(0);
});

try {
  await Promise.all([
    waitForUpstream('BibleTimeline server', BIBLE_PORT),
    waitForUpstream('NamePlaceAnimalThing server', NPAT_PORT)
  ]);

  isGatewayReady = true;
  server.listen(PORT, () => {
    console.log(`Church Games gateway listening on ${PORT}`);
    console.log(`Bible Timeline proxied via /bibletimeline -> ${BIBLE_PORT}`);
    console.log(`NamePlaceAnimalThing proxied via /nameplaceanimalthing -> ${NPAT_PORT}`);
  });
} catch (error) {
  console.error(String(error?.message || error));
  await shutdown(1);
}
