# Bible Timeline Frontend

React frontend for Bible Timeline, including the PvP room, round, and results screens.

## Scripts

- `npm start` - start the CRA development server
- `npm run build` - create a production build
- `npm test` - run tests in watch mode

## PvP notes

- PvP room membership now uses a server-issued session token after room create/join.
- Refreshing or reconnecting from the same browser profile should restore the same PvP player slot.
- Host-only actions and score-affecting submissions are authorized from the active socket session.
- When mounted behind the combined gateway, the frontend connects through `/bibletimeline/socket.io`.

## Local development

For the full combined app, run commands from the repo root:

```bash
npm install
npm run build
npm start
```

For frontend-only work:

```bash
npm install
npm start
```

If you run the frontend separately from the combined gateway, ensure the PvP server is also running.
