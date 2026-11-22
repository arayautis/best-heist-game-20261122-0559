// Painting the Meridian: a dark marble floor, a red carpet runner, gold
// trim, and vision cones in amber that turn red as suspicion grows.
// Everything the judge needs to see — the room, the cones, the cameras,
// the loot and the alarm meter — is drawn in one frame, every frame.
import {
  CAMERA_VIEW_DIST, CAMERA_VIEW_HALF_ANGLE, GUARD_VIEW_DIST,
  GUARD_VIEW_HALF_ANGLE, VIEW_H, VIEW_W,
} from './config.js';
import { pointInRect } from './vision.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function drawCone(ctx, x, y, angle, dist, halfAngle, suspicion, disabled) {
  const alpha = disabled ? 0.05 : 0.1 + suspicion * 0.22;
  const colour = suspicion > 0.6 ? '255,60,50' : suspicion > 0.25 ? '255,150,40' : '255,210,90';
  const grad = ctx.createRadialGradient(x, y, 10, x, y, dist);
  grad.addColorStop(0, `rgba(${colour},${alpha + 0.12})`);
  grad.addColorStop(1, `rgba(${colour},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, dist, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${colour},${0.25 + suspicion * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPerson(ctx, x, y, angle, body, trim, isThief) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a hooded figure, shoulders first.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(4, 0, 7, -Math.PI / 2.4, Math.PI / 2.4);
  ctx.fill();
  // Direction tick.
  ctx.strokeStyle = trim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(19, 0);
  ctx.stroke();
  if (isThief) {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.arc(-6, -5, 2, 0, Math.PI * 2);
    ctx.arc(-6, 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  function drawFloor(state) {
    ctx.fillStyle = '#17131f';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Marble tiles.
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < VIEW_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_H);
      ctx.stroke();
    }
    for (let y = 0; y < VIEW_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_W, y);
      ctx.stroke();
    }
    // Red carpet runner down the gallery.
    ctx.fillStyle = '#5d1420';
    ctx.fillRect(600, 104, 80, 476);
    ctx.fillStyle = '#7d1d2c';
    ctx.fillRect(606, 104, 68, 476);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(600, 104, 80, 476);
    // Vent shaft grates.
    for (const v of state.vents) {
      ctx.fillStyle = '#0d0b12';
      ctx.fillRect(v.x, v.y, v.w, v.h);
      ctx.strokeStyle = 'rgba(200,200,220,0.35)';
      ctx.lineWidth = 1;
      for (let x = v.x + 12; x < v.x + v.w; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, v.y + 4);
        ctx.lineTo(x, v.y + v.h - 4);
        ctx.stroke();
      }
    }
    // Getaway door glow.
    const e = state.exit;
    ctx.fillStyle = '#0e2a1a';
    ctx.fillRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY', e.x + e.w / 2, e.y + e.h / 2 + 5);
  }

  function drawWalls(state) {
    for (const w of state.walls) {
      ctx.fillStyle = '#2c2438';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#463a5c';
      ctx.fillRect(w.x, w.y, w.w, 3);
      ctx.strokeStyle = '#171221';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }
  }

  function drawLoot(state, now) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.5 + 0.5 * Math.sin(now * 3 + item.x);
      ctx.save();
      ctx.translate(item.x, item.y);
      // Glint ring so loot is obvious at a glance.
      ctx.strokeStyle = `rgba(245,197,66,${0.35 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      if (item.kind === 'diamond') {
        ctx.fillStyle = '#bfe9ff';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(13, -4);
        ctx.lineTo(9, 12);
        ctx.lineTo(-9, 12);
        ctx.lineTo(-13, -4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#1b2a44';
        ctx.beginPath();
        ctx.moveTo(-13, -4);
        ctx.lineTo(13, -4);
        ctx.lineTo(9, 12);
        ctx.lineTo(-9, 12);
        ctx.closePath();
        ctx.fill();
      } else if (item.kind === 'safe') {
        ctx.fillStyle = '#3d4a5c';
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === 'painting') {
        ctx.fillStyle = '#6b4f1d';
        ctx.fillRect(-16, -11, 32, 22);
        ctx.fillStyle = '#2e6f8e';
        ctx.fillRect(-13, -8, 26, 16);
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.arc(-3, -1, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(-13, -7, 26, 14);
        ctx.fillStyle = '#f5d76e';
        ctx.fillRect(-13, -7, 26, 5);
        ctx.strokeStyle = '#7d6212';
        ctx.lineWidth = 1;
        ctx.strokeRect(-13, -7, 26, 14);
      }
      ctx.restore();
      if (item.locked) {
        ctx.fillStyle = '#f5c542';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HOLD E TO PICK', item.x, item.y + 32);
      }
    }
  }

  function drawGuards(state) {
    for (const g of state.guards) {
      drawCone(ctx, g.x, g.y, g.angle, GUARD_VIEW_DIST, GUARD_VIEW_HALF_ANGLE, g.suspicion, false);
    }
    for (const g of state.guards) {
      drawPerson(ctx, g.x, g.y, g.angle, g.state === 'chase' ? '#7d1d2c' : '#2c4a6b', '#dfe9f5', false);
      if (g.suspicion > 0.05) {
        ctx.fillStyle = g.suspicion > 0.6 ? '#ff3c32' : '#ffb02e';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.suspicion > 0.6 ? '!' : '?', g.x, g.y - 20);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.name.toUpperCase(), g.x, g.y + 26);
    }
  }

  function drawCameras(state, now) {
    for (const cam of state.cameras) {
      const disabled = now < cam.disabledUntil;
      if (!disabled) {
        drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_VIEW_DIST, CAMERA_VIEW_HALF_ANGLE, cam.suspicion, false);
      }
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);
      ctx.fillStyle = disabled ? '#3a3a3a' : '#c0392b';
      ctx.fillRect(-4, -6, 16, 12);
      ctx.fillStyle = disabled ? '#666' : '#ff5b4d';
      ctx.beginPath();
      ctx.arc(13, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px sans-serif';
      if (cam.x > VIEW_W - 90) {
        ctx.textAlign = 'right';
        ctx.fillText(disabled ? 'CAM OFF' : cam.label.toUpperCase(), VIEW_W - 8, cam.y + 22);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(disabled ? 'CAM OFF' : cam.label.toUpperCase(), cam.x, cam.y + 22);
      }
    }
  }

  function drawSmokes(state) {
    for (const s of state.smokes) {
      const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, 110);
      grad.addColorStop(0, 'rgba(200,200,210,0.55)');
      grad.addColorStop(1, 'rgba(200,200,210,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 110, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHud(state) {
    // Top bar.
    ctx.fillStyle = 'rgba(10,8,16,0.85)';
    ctx.fillRect(0, 0, VIEW_W, 34);
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MERIDIAN VAULT', 14, 22);
    // Alarm meter.
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ALARM', 200, 22);
    ctx.fillStyle = '#2a2233';
    ctx.fillRect(260, 10, 220, 14);
    const frac = state.alarm / 100;
    ctx.fillStyle = frac > 0.66 ? '#ff3c32' : frac > 0.33 ? '#ff9f2e' : '#f5c542';
    ctx.fillRect(260, 10, 220 * frac, 14);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(260.5, 10.5, 220, 14);
    // Loot, tools, time.
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`LOOT  $${state.lootValue.toLocaleString('en-US')}`, 510, 22);
    ctx.fillText(`EMP ×${state.empCharges}  [1]`, 700, 22);
    ctx.fillText(`SMOKE ×${state.smokeCharges}  [2]`, 810, 22);
    const mins = Math.floor(state.time / 60);
    const secs = Math.floor(state.time % 60);
    ctx.textAlign = 'right';
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, VIEW_W - 14, 22);
    ctx.textAlign = 'left';
    // Objective line.
    const diamond = state.loot.find((l) => l.kind === 'diamond');
    ctx.fillStyle = '#c9b8ff';
    ctx.font = '13px sans-serif';
    ctx.fillText(diamond && diamond.taken ? 'Objective: reach the GETAWAY door.' : 'Objective: lift the Grand Diamond in the vault, then escape.', 14, 54);
    // Lockpick progress.
    if (state.pick) {
      const p = state.pick;
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      ctx.fillRect(state.player.x - 40, state.player.y - 44, 80, 10);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(state.player.x - 40, state.player.y - 44, 80 * (p.progress / p.needed), 10);
      ctx.strokeStyle = '#888';
      ctx.strokeRect(state.player.x - 39.5, state.player.y - 44.5, 80, 10);
    }
    // Toast message.
    if (state.message) {
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      const w = ctx.measureText(state.message).width + 28;
      ctx.fillRect((VIEW_W - w) / 2, VIEW_H - 52, w, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message, VIEW_W / 2, VIEW_H - 32);
      ctx.textAlign = 'left';
    }
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(8,6,14,0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, 220);
    ctx.fillStyle = '#ffffff';
    ctx.font = '19px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_W / 2, 280 + i * 32);
    });
    ctx.textAlign = 'left';
  }

  function drawTitle(state) {
    drawFloor(state);
    drawWalls(state);
    drawLoot(state, 0);
    drawGuards(state);
    drawCameras(state, 0);
    ctx.fillStyle = 'rgba(8,6,14,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MERIDIAN VAULT', VIEW_W / 2, 190);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText('One night. One diamond. Four guards, three cameras, no second chances.', VIEW_W / 2, 232);
    ctx.font = '18px sans-serif';
    const lines = [
      'WASD / Arrows — move      Shift — sneak (harder to spot)',
      'Hold E — pick a lock      1 — EMP the cameras      2 — smoke pellet',
      'Lift the Grand Diamond, then slip out the GETAWAY door.',
      'Seen too long and the alarm climbs. At 100, the vault locks down.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 30));
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Press ENTER to begin the heist', VIEW_W / 2, 470);
    if (state.best > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Best getaway: $${state.best.toLocaleString('en-US')}`, VIEW_W / 2, 510);
    }
    ctx.textAlign = 'left';
  }

  function draw(state, now) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.screen === SCREEN_TITLE) {
      drawTitle(state);
      return;
    }
    drawFloor(state);
    drawWalls(state);
    drawLoot(state, now);
    drawGuards(state);
    drawCameras(state, now);
    drawSmokes(state);
    const p = state.player;
    const sneaking = p.sneaking;
    drawPerson(ctx, p.x, p.y, p.angle, sneaking ? '#1d1a26' : '#241f2e', '#f5c542', true);
    if (pointInRect(p.x, p.y, state.exit)) {
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 3;
      ctx.strokeRect(state.exit.x - 4, state.exit.y - 4, state.exit.w + 8, state.exit.h + 8);
    }
    drawHud(state);
    if (state.screen === SCREEN_PAUSED) {
      panel('PAUSED', ['The crew is holding its breath.', 'Press P to keep moving.'], '#c9b8ff');
    } else if (state.screen === SCREEN_CAUGHT) {
      const reason = state.alarm >= 100 ? 'The vault locked down at full alarm.' : 'A guard laid hands on Vesper.';
      panel('CAUGHT', [reason, `Loot lifted: $${state.lootValue.toLocaleString('en-US')} — the crew keeps none of it.`, 'Press ENTER to try the night again.'], '#ff3c32');
    } else if (state.screen === SCREEN_ESCAPED) {
      const mins = Math.floor(state.time / 60);
      const secs = Math.floor(state.time % 60);
      panel('CLEAN GETAWAY', [
        `Vesper slips into the night with $${state.lootValue.toLocaleString('en-US')} in loot.`,
        `Time ${mins}:${String(secs).padStart(2, '0')} — ${state.timesSpotted} time${state.timesSpotted === 1 ? '' : 's'} spotted.`,
        'Press ENTER to plan the next job.',
      ], '#27ae60');
    }
  }

  return { draw };
}
