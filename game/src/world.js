// The heist itself: movement, patrols, vision, suspicion, the alarm,
// lockpicking, tools and the win/lose conditions. Rendering lives in
// render.js; this file only advances the state, one fixed step at a time.
import {
  ALARM_CAMERA_TRIP, ALARM_DECAY, ALARM_LOCKDOWN, ALARM_TRIP_ADD,
  CAMERA_SWEEP_ARC, CAMERA_SWEEP_SPEED, EMP_CHARGES, EMP_DISABLE_SECS,
  GUARD_CATCH_DIST, GUARD_CHASE_SPEED, GUARD_GIVE_UP_SECS, GUARD_PATROL_SPEED,
  GUARD_RADIUS, PICK_DIAMOND_SECS, PICK_RANGE, PICK_SAFE_SECS, PLAYER_RADIUS,
  PLAYER_SNEAK_SPEED, PLAYER_SPEED, SMOKE_CHARGES, SMOKE_RADIUS, SMOKE_SECS,
  SUSPICION_CHASE_AT, SUSPICION_DRAIN, SUSPICION_FILL_EDGE,
  SUSPICION_FILL_SEEN, SUSPICION_FILL_SNEAK, VIEW_H, VIEW_W,
} from './config.js';
import { createLevel } from './level.js';
import { coneStrength, hasLineOfSight, pointInRect } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

export const EVENT_SPOTTED = 'spotted';
export const EVENT_ALARM = 'alarm';
export const EVENT_PICKUP = 'pickup';
export const EVENT_CLICK = 'click';
export const EVENT_EMP = 'emp';
export const EVENT_CAUGHT = 'caught';
export const EVENT_WIN = 'win';

function collideCircleWalls(p, r, walls) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(p.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(p.y, w.y + w.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 === 0) {
        p.y = w.y - r;
      } else {
        const d = Math.sqrt(d2);
        p.x = cx + (dx / d) * r;
        p.y = cy + (dy / d) * r;
      }
    }
  }
}

function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createWorld(random) {
  const level = createLevel();
  const events = [];

  const state = {
    screen: SCREEN_TITLE,
    time: 0,
    alarm: 0,
    alarmPeak: 0,
    lootValue: 0,
    lootTaken: 0,
    timesSpotted: 0,
    empCharges: EMP_CHARGES,
    smokeCharges: SMOKE_CHARGES,
    player: { x: level.spawn.x, y: level.spawn.y, angle: -Math.PI / 2, moving: false, sneaking: false },
    guards: level.guards,
    cameras: level.cameras,
    loot: level.loot,
    walls: level.walls,
    vents: level.vents,
    exit: level.exit,
    smokes: [],
    pick: null, // { loot, progress, needed }
    message: '',
    messageUntil: 0,
    best: 0,
  };

  function say(text, secs = 2.5) {
    state.message = text;
    state.messageUntil = state.time + secs;
  }

  function inVent(x, y) {
    return state.vents.some((v) => pointInRect(x, y, v));
  }

  function inSmoke(x, y) {
    return state.smokes.some((s) => Math.hypot(x - s.x, y - s.y) < SMOKE_RADIUS);
  }

  function reset() {
    const fresh = createLevel();
    state.time = 0;
    state.alarm = 0;
    state.alarmPeak = 0;
    state.lootValue = 0;
    state.lootTaken = 0;
    state.timesSpotted = 0;
    state.empCharges = EMP_CHARGES;
    state.smokeCharges = SMOKE_CHARGES;
    state.player.x = fresh.spawn.x;
    state.player.y = fresh.spawn.y;
    state.player.angle = -Math.PI / 2;
    state.guards = fresh.guards;
    state.cameras = fresh.cameras;
    state.loot = fresh.loot;
    state.walls = fresh.walls;
    state.vents = fresh.vents;
    state.exit = fresh.exit;
    state.smokes = [];
    state.pick = null;
    state.message = '';
    state.messageUntil = 0;
  }

  function start() {
    reset();
    state.screen = SCREEN_PLAY;
    say('Lift the Grand Diamond, then slip out the getaway door.', 4);
  }

  function tripAlarm(amount, watcher) {
    state.alarm = Math.min(ALARM_LOCKDOWN, state.alarm + amount);
    state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
    state.timesSpotted += 1;
    events.push(EVENT_ALARM);
    if (watcher && watcher.waypoints) {
      watcher.state = 'chase';
      watcher.chaseTime = 0;
      watcher.lastSeenX = state.player.x;
      watcher.lastSeenY = state.player.y;
    }
  }

  function updateWatcher(watcher, isCamera, dt, now) {
    if (isCamera) {
      if (now < watcher.disabledUntil) {
        watcher.suspicion = 0;
        return;
      }
      watcher.angle += watcher.sweep * CAMERA_SWEEP_SPEED * dt;
      if (watcher.angle > watcher.home + CAMERA_SWEEP_ARC) {
        watcher.angle = watcher.home + CAMERA_SWEEP_ARC;
        watcher.sweep = -1;
      } else if (watcher.angle < watcher.home - CAMERA_SWEEP_ARC) {
        watcher.angle = watcher.home - CAMERA_SWEEP_ARC;
        watcher.sweep = 1;
      }
    }
    const p = state.player;
    const hidden = inSmoke(p.x, p.y);
    const strength = hidden ? 0 : coneStrength(watcher, p.x, p.y, state.walls, isCamera);
    if (strength > 0) {
      let rate = SUSPICION_FILL_SEEN;
      if (p.sneaking) rate = SUSPICION_FILL_SNEAK;
      if (strength < 0.55) rate = Math.min(rate, SUSPICION_FILL_EDGE);
      if (inVent(p.x, p.y)) rate *= 0.25;
      const before = watcher.suspicion;
      watcher.suspicion = Math.min(1, watcher.suspicion + rate * strength * dt);
      if (before < 0.35 && watcher.suspicion >= 0.35) events.push(EVENT_SPOTTED);
      if (watcher.suspicion >= SUSPICION_CHASE_AT) {
        watcher.suspicion = 0.4;
        tripAlarm(isCamera ? ALARM_CAMERA_TRIP : ALARM_TRIP_ADD, watcher);
      }
      if (watcher.state === 'chase' || !isCamera) {
        watcher.lastSeenX = p.x;
        watcher.lastSeenY = p.y;
      }
    } else {
      watcher.suspicion = Math.max(0, watcher.suspicion - SUSPICION_DRAIN * dt);
    }
  }

  function moveGuard(g, dt) {
    let tx;
    let ty;
    let speed = GUARD_PATROL_SPEED;
    if (g.state === 'chase') {
      tx = g.lastSeenX;
      ty = g.lastSeenY;
      speed = GUARD_CHASE_SPEED;
      g.chaseTime += dt;
      const dx = state.player.x - g.x;
      const dy = state.player.y - g.y;
      const seen = Math.hypot(dx, dy) < 320 && hasLineOfSight(g.x, g.y, state.player.x, state.player.y, state.walls);
      if (seen) g.chaseTime = 0;
      if (g.chaseTime > GUARD_GIVE_UP_SECS) {
        g.state = 'patrol';
        g.suspicion = 0;
      }
    } else {
      const wp = g.waypoints[g.waypointIndex];
      tx = wp[0];
      ty = wp[1];
    }
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const step = Math.min(dist, speed * dt);
      g.x += (dx / dist) * step;
      g.y += (dy / dist) * step;
      collideCircleWalls(g, GUARD_RADIUS, state.walls);
      g.angle = angleLerp(g.angle, Math.atan2(dy, dx), Math.min(1, dt * 8));
    } else if (g.state === 'patrol') {
      g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
    }
    if (g.state === 'chase') {
      const p = state.player;
      if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD_CATCH_DIST) {
        state.screen = SCREEN_CAUGHT;
        events.push(EVENT_CAUGHT);
      }
    }
  }

  function nearestLoot(maxDist) {
    let bestLoot = null;
    let bestDist = maxDist;
    for (const item of state.loot) {
      if (item.taken) continue;
      const d = Math.hypot(item.x - state.player.x, item.y - state.player.y);
      if (d < bestDist) {
        bestDist = d;
        bestLoot = item;
      }
    }
    return bestLoot;
  }

  function update(dt, input) {
    if (state.screen !== SCREEN_PLAY) return;
    state.time += dt;
    const p = state.player;
    const axis = input.axis();
    p.sneaking = input.held.has('sneak');
    const speed = p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    p.moving = axis.x !== 0 || axis.y !== 0;
    if (p.moving) {
      p.x += axis.x * speed * dt;
      p.y += axis.y * speed * dt;
      collideCircleWalls(p, PLAYER_RADIUS, state.walls);
      // The getaway door is a gap in the wall, not a gap in the world:
      // the thief stays on the floor until the win fires inside the doorway.
      p.x = Math.max(PLAYER_RADIUS, Math.min(VIEW_W - PLAYER_RADIUS, p.x));
      p.y = Math.max(PLAYER_RADIUS, Math.min(VIEW_H - PLAYER_RADIUS, p.y));
      p.angle = angleLerp(p.angle, Math.atan2(axis.y, axis.x), Math.min(1, dt * 10));
    }

    // Tools.
    if (input.wasPressed('emp') && state.empCharges > 0) {
      state.empCharges -= 1;
      for (const cam of state.cameras) {
        cam.disabledUntil = state.time + EMP_DISABLE_SECS;
        cam.suspicion = 0;
      }
      events.push(EVENT_EMP);
      say('EMP burst — every camera is dark for a while.', 2.5);
    }
    if (input.wasPressed('smoke') && state.smokeCharges > 0) {
      state.smokeCharges -= 1;
      state.smokes.push({ x: p.x, y: p.y, until: state.time + SMOKE_SECS });
      say('Smoke out — no one can see through it.', 2);
    }
    state.smokes = state.smokes.filter((s) => s.until > state.time);

    // Loot: loose pieces lift on touch; locked ones need a held pick.
    for (const item of state.loot) {
      if (item.taken || item.locked) continue;
      if (Math.hypot(item.x - p.x, item.y - p.y) < 30) {
        item.taken = true;
        state.lootValue += item.value;
        state.lootTaken += 1;
        events.push(EVENT_PICKUP);
        say(`${item.label} — $${item.value.toLocaleString('en-US')}.`, 2);
      }
    }
    const near = nearestLoot(PICK_RANGE);
    if (near && near.locked && input.held.has('interact')) {
      if (!state.pick || state.pick.loot !== near) {
        state.pick = { loot: near, progress: 0, needed: near.kind === 'diamond' ? PICK_DIAMOND_SECS : PICK_SAFE_SECS };
      }
      state.pick.progress += dt;
      if (Math.floor(state.pick.progress * 2) !== Math.floor((state.pick.progress - dt) * 2)) {
        events.push(EVENT_CLICK);
      }
      if (state.pick.progress >= state.pick.needed) {
        near.taken = true;
        state.lootValue += near.value;
        state.lootTaken += 1;
        events.push(EVENT_PICKUP);
        say(near.kind === 'diamond' ? 'The Grand Diamond is yours. Now run.' : `${near.label} cracked — $${near.value.toLocaleString('en-US')}.`, 3);
        state.pick = null;
      }
    } else {
      state.pick = null;
    }

    // Watchers.
    let anyoneSees = false;
    for (const g of state.guards) {
      updateWatcher(g, false, dt, state.time);
      if (g.suspicion > 0.05) anyoneSees = true;
      moveGuard(g, dt);
    }
    for (const cam of state.cameras) {
      updateWatcher(cam, true, dt, state.time);
      if (cam.suspicion > 0.05) anyoneSees = true;
    }
    if (!anyoneSees) {
      state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
    }
    if (state.alarm >= ALARM_LOCKDOWN) {
      state.screen = SCREEN_CAUGHT;
      events.push(EVENT_CAUGHT);
      return;
    }

    // The getaway: the diamond first, then the door.
    if (pointInRect(p.x, p.y, state.exit)) {
      const diamond = state.loot.find((l) => l.kind === 'diamond');
      if (diamond && diamond.taken) {
        state.screen = SCREEN_ESCAPED;
        events.push(EVENT_WIN);
      } else if (state.time - (state.lastExitWarn || -10) > 3) {
        state.lastExitWarn = state.time;
        say('The job is not done — the Grand Diamond first.', 2.5);
      }
    }

    if (state.message && state.time > state.messageUntil) state.message = '';
  }

  return {
    state,
    events,
    start,
    reset,
    update,
    say,
    // A clean getaway rating from loot and time: the faster and richer, the better.
    rating() {
      if (state.lootValue >= 300000 && state.time < 180) return 'S — Ghost of Meridian';
      if (state.lootValue >= 280000) return 'A — Clean Getaway';
      if (state.lootValue >= 250000) return 'B — The Diamond Job';
      return 'C — Small Score';
    },
  };
}
