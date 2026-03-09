# Church Games (Single Render Web Service)

This folder combines both games under one deployable service:

- `/bibletimeline` -> Bible TimeLine app + PvP server
- `/nameplaceanimalthing` -> Name Place Animal Thing app
- `/` -> launcher page to choose a game
- `/health` -> health check endpoint

## Folder layout

- `apps/bibletimeline/frontend` (copied from Bible-TimeLine/frontend)
- `apps/bibletimeline/server` (copied from Bible-TimeLine/server)
- `apps/nameplaceanimalthing` (copied from NamePlaceAnimalThing)
- `gateway/server.mjs` (reverse-proxy launcher)
- `scripts/build-all.mjs` (installs + builds both games)

## Local run

From this folder:

```bash
npm install
npm run build
npm start
```

Open:

- `http://localhost:10000/`
- `http://localhost:10000/bibletimeline`
- `http://localhost:10000/nameplaceanimalthing`

## Render deploy

Use this folder as repo root (or commit this folder contents to a dedicated repo), then:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

`render.yaml` is included for blueprint deployment.

## Important note

Both games currently use Socket.IO at `/socket.io`. The gateway routes socket traffic by page referer so each game works under one domain and one service.
