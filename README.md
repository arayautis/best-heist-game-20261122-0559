# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/arayautis/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/arayautis/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Meridian Vault is a top-down 2D heist game: Vesper, a master thief, slips into the Grand Meridian Museum at night to lift the Grand Diamond. Four guards patrol with sweeping vision cones, three security cameras sweep the gallery, the vault and the corridor, and every second spent in a cone pushes the alarm meter higher. Sneak, pick locks, spend an EMP or a smoke pellet, grab the paintings and the gold on the way — then slip out the getaway door before the vault locks down.

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — every file the game loads lives under `game/`.

## How to play

- **WASD / Arrow keys** — move
- **Shift** — sneak (slower, much harder to spot, and nearly invisible in the vent shaft)
- **Hold E** — pick a lock (the diamond, the wall safe)
- **1** — EMP burst, kills every camera for 9 seconds (2 charges)
- **2** — smoke pellet, breaks line of sight for 5 seconds (2 charges)
- **P** — pause, **M** — mute, **Enter** — start / retry

## The job

- The **Grand Diamond** sits on its pedestal in the vault, top right — guarded by Sofia and the vault camera. The vent shaft along the top runs from the safe room to the vault for a quiet way in.
- The **wall safe** (top left), three **paintings** and two stacks of **gold bars** are the bonus loot. Loose loot lifts on touch; locked loot needs a held lockpick.
- Get **seen** and a watcher's suspicion fills; full suspicion trips the alarm and the guard gives chase. At alarm **100** the vault locks down and the run ends.
- Grab the diamond, then reach the **GETAWAY** door, bottom left. Your rating runs from C (small score) to S (Ghost of Meridian).

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` — the page; `game/src/` — one file per job: `config.js` (tuning), `level.js` (the museum floor), `vision.js` (cones and line of sight), `world.js` (the simulation), `render.js` (the painting), `input.js`, `audio.js` (synthesised cues, no audio files), `shots.js` (screenshot staging), `main.js` (boot and loop).
- `screenshots/` — real renders of the game's own code: the heist in full swing, the title, the alarm moment, and the clean getaway.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
