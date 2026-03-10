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

Both games are served behind one gateway, but each game now uses an explicit socket route:

- `/bibletimeline/socket.io`
- `/nameplaceanimalthing/socket.io`

The gateway waits for both upstream apps to become healthy before it reports ready on `/health` or starts proxying game traffic.

## Multiplayer sessions

Both PvP systems now use server-issued session tokens for room membership and reconnects.

- Reconnects restore the existing player slot instead of creating a new player.
- Temporary disconnects do not immediately remove the player from the room.
- Host-only and score-affecting actions are authorized from the socket session, not just a client-supplied player id.
- NPAT room-state is filtered per player so private scoring assignments and answer data are not broadcast to everyone.

Room state is still in memory only. Restarting the service clears active matches.

## Multiplayer smoke test

Use two browser sessions and verify the following for both games:

1. Create a room in one browser and join it from a second browser.
2. Start a match and play at least one scoring round.
3. Close or refresh one browser tab during the match.
4. Reopen the same room in that same browser profile.
5. Verify the player rejoins the existing slot and keeps prior score/progress.
6. Verify the host can still continue rounds and finish the match.

For Bible Timeline-specific PvP checks, see `apps/bibletimeline/server/SMOKE_TEST_CHECKLIST.md`.
