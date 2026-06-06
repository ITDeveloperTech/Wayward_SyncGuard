# Sync Guard

Wayward mod that mitigates multiplayer desyncs caused by mass inventory/container operations.

## Features

- Rate-limits bulk item moves and container sorting on the **authoritative server**
- Logs bulk container operations to `Wayward/logs/`
- Tracks session and lifetime stats
- Chat command: `/syncguard help`

## Setup

```powershell
npm install
npm run build
```

The mod is linked into the game at `Wayward/mods/custom-mod`.

## Dedicated server

1. Copy or link this folder into `Wayward/mods/` on the server machine.
2. Build `out/Mod.js` before starting the server.
3. Enable **Sync Guard** in the server mod list (or place it in the server `mods` folder for dedicated hosts).
4. Use `/syncguard stats` in chat to inspect runtime stats.

Throttling is enforced on the server in multiplayer. Clients only receive warnings for their own local player.

## Commands

| Command | Description |
|---------|-------------|
| `/syncguard stats` | Show session counters |
| `/syncguard throttle on\|off` | Enable/disable throttling |
| `/syncguard maxitems N` | Max items per single move (1–200) |
| `/syncguard cooldown N` | Move cooldown in ms (0–5000) |
| `/syncguard bulkcooldown N` | Bulk move cooldown in ms (0–10000) |
| `/syncguard verbose on\|off` | Toggle detailed container logging |

## Development

```powershell
npm run watch
```
