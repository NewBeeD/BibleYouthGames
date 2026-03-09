# PvP Smoke Test Checklist

## Automated (recommended)

1. Start PvP server:
   - `cd server`
   - `npm install`
   - `npm start`
2. In another terminal run:
   - `cd server`
   - `npm run smoke:pvp`
3. Pass criteria:
   - Output contains `PVP_SMOKE_OK`
   - JSON result includes `rounds: 6`
   - Leaderboard has 2 players

## Manual quick flow

1. Open app and sign in as host.
2. Select `PvP` then `CREATE`.
3. In a second browser/session sign in as joiner and use `JOIN` with 6-digit code.
4. Both users click `Ready`.
5. Host clicks `Start Match`.
6. Verify 6 rounds execute in order: Easy, Easy, Easy, Medium, Medium, Hard.
7. For each round verify:
   - Players can submit order
   - Round ends on all submissions (or timer)
   - Round leaderboard appears
   - Host can proceed with `Next Round`
8. After round 6 verify final leaderboard appears.
9. Verify leaderboard pages:
   - `Classic` and `Speed` show Easy/Medium/Hard columns
   - `PvP` shows Wins/Total/Best columns

## Data checks (Realtime Database)

After playing, verify user records under:

- `users/{uid}/data/OT/classic/{easy|medium|hard}`
- `users/{uid}/data/OT/speed/{easy|medium|hard}`
- `users/{uid}/data/OT/pvp/{wins,totalPoints,bestMatch}`

And same structure for `NT` and `MX`.
