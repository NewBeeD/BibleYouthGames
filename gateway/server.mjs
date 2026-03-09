import { createServer } from 'node:http';
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

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${options.name} exited with code ${code}`);
    }
  });

  return child;
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
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Church Games</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: radial-gradient(circle at 20% 20%, #1d4ed8, #0f172a 65%); color: #fff; min-height: 100vh; display: grid; place-items: center; }
      .card { width: min(92vw, 720px); background: rgba(2,6,23,.85); border: 1px solid rgba(255,255,255,.2); border-radius: 18px; padding: 28px; }
      h1 { margin: 0 0 10px; font-size: 2rem; }
      p { margin: 0 0 22px; color: #dbeafe; }
      .row { display: grid; grid-template-columns: 1fr; gap: 12px; }
      a { text-decoration: none; display: block; text-align: center; padding: 14px 16px; border-radius: 12px; color: #fff; font-weight: 700; }
      a.bible { background: linear-gradient(90deg,#1976d2,#42a5f5); }
      a.npat { background: linear-gradient(90deg,#7c4dff,#1976d2); }
      .small { margin-top: 14px; color: #bfdbfe; font-size: .9rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Church Games</h1>
      <p>Choose a game to play.</p>
      <div class="row">
        <a class="bible" href="/bibletimeline">Play Bible Timeline</a>
        <a class="npat" href="/nameplaceanimalthing">Play Name Place Animal Thing</a>
      </div>
      <div class="small">Single Render Web Service launcher</div>
    </div>
  </body>
</html>`;

const pickSocketTarget = (req) => {
  const referer = String(req.headers.referer || '');
  if (referer.includes('/bibletimeline')) {
    return `http://127.0.0.1:${BIBLE_PORT}`;
  }

  return `http://127.0.0.1:${NPAT_PORT}`;
};

const rewritePath = (req, prefix) => {
  const original = req.url || '/';
  const next = original.replace(prefix, '') || '/';
  req.url = next.startsWith('/') ? next : `/${next}`;
};

const server = createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (requestPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
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

  if (requestPath.startsWith('/socket.io')) {
    proxy.web(req, res, { target: pickSocketTarget(req) });
    return;
  }

  res.writeHead(302, { Location: '/' });
  res.end();
});

server.on('upgrade', (req, socket, head) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (requestPath.startsWith('/socket.io')) {
    proxy.ws(req, socket, head, { target: pickSocketTarget(req) });
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

server.listen(PORT, () => {
  console.log(`Church Games gateway listening on ${PORT}`);
  console.log(`Bible Timeline proxied via /bibletimeline -> ${BIBLE_PORT}`);
  console.log(`NamePlaceAnimalThing proxied via /nameplaceanimalthing -> ${NPAT_PORT}`);
});

const shutdown = () => {
  bibleProcess.kill('SIGTERM');
  npatProcess.kill('SIGTERM');
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
