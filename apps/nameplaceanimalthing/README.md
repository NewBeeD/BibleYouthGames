# Name Place Animal Things

Realtime multiplayer game using Next.js 14 (App Router), Tailwind CSS, Socket.IO, and Zustand.

## Routes

- `/` landing page with How To Play modal.
- `/create` create game form (username, rounds, categories, scoring mode).
- `/join` join existing game with username and 6-digit code.
- `/game/[code]` lobby, play, scoring, and end-game podium.
- `/api/socket` initializes Socket.IO backend runtime.

## Tech Stack

- Next.js 14 + React 18
- Tailwind CSS 3 + PostCSS + Autoprefixer
- Socket.IO (`socket.io`, `socket.io-client`)
- Zustand for global game state

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - lint codebase

## Notes

- Socket server runs in `server.mjs` on the same port as Next.js for Render compatibility.
- `/api/socket` returns the Socket.IO URL for client bootstrap.
- In-memory room state is used for MVP and resets on restart.
- AI grading uses OpenAI Responses API when `OPENAI_API_KEY` is configured.
- If AI is unavailable, server falls back to local heuristic validation.
- Multiplayer actions use a server-issued session token after room join/create.
- Temporary disconnects keep the player slot and score so the same browser session can rejoin.
- Scoring assignments and manual score locks are emitted per player instead of being broadcast to the whole room.

## Reconnect behavior

- Refreshing or reconnecting from the same browser profile should restore the same room membership.
- If the server rejects a reconnect token, the client is sent back to join/create flow.
- Active matches still live only in server memory, so a full server restart clears room state.

## AI Validation Setup

Set these environment variables:

- `OPENAI_API_KEY` (required for true AI validation)
- `OPENAI_MODEL` (optional, default: `gpt-4.1-mini`)

## Render

Use a single Web Service with:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variable: `NODE_ENV=production`
