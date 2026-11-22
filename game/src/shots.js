// Staging for screenshots: ?shot=start|play|alarm|end with &seed=N paints
// one frozen scene instead of running the loop, twice, then sets
// window.__shotReady so a screenshot tool knows the frame is settled.
// The scenes are the real game state, posed — never edited or composited.
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY } from './world.js';

export function stageShot(name, world) {
  const s = world.state;
  if (name === 'start') {
    s.screen = 'title';
    return { screen: 'title', best: s.best };
  }
  if (name === 'play') {
    // Mid-heist: Vesper crosses the gallery on the carpet, two guards sweep
    // their cones across the room, a camera watches, the diamond glints in
    // the vault and the alarm sits at a nervous third.
    s.screen = SCREEN_PLAY;
    s.player.x = 640;
    s.player.y = 430;
    s.player.angle = -Math.PI / 2;
    s.player.sneaking = true;
    s.alarm = 34;
    s.alarmPeak = 34;
    s.lootValue = 18000;
    s.lootTaken = 1;
    s.time = 74;
    s.loot.find((l) => l.id === 'painting1').taken = true;
    s.guards[0].x = 520;
    s.guards[0].y = 330;
    s.guards[0].angle = Math.PI / 4;
    s.guards[0].suspicion = 0.55;
    s.guards[1].x = 820;
    s.guards[1].y = 190;
    s.guards[1].angle = Math.PI * 0.8;
    s.guards[1].suspicion = 0.2;
    s.guards[2].x = 900;
    s.guards[2].y = 640;
    s.guards[2].angle = Math.PI;
    s.guards[3].x = 1060;
    s.guards[3].y = 170;
    s.guards[3].angle = -Math.PI / 2;
    s.cameras[0].angle = Math.PI / 2 + 0.5;
    s.cameras[1].angle = Math.PI * 0.7;
    s.cameras[2].angle = Math.PI + 0.4;
    s.message = 'The Duchess is lifted — now the vault.';
    s.messageUntil = 999999;
    return { screen: SCREEN_PLAY, best: s.best };
  }
  if (name === 'alarm') {
    // The caught moment, a breath before the chase lands: the alarm is
    // nearly full, a guard is on Vesper's heels, smoke hangs in the air.
    s.screen = SCREEN_PLAY;
    s.player.x = 700;
    s.player.y = 480;
    s.player.angle = Math.PI;
    s.player.sneaking = false;
    s.alarm = 82;
    s.alarmPeak = 82;
    s.lootValue = 43000;
    s.lootTaken = 2;
    s.time = 131;
    s.loot.find((l) => l.id === 'painting1').taken = true;
    s.loot.find((l) => l.id === 'gold1').taken = true;
    s.guards[0].x = 620;
    s.guards[0].y = 470;
    s.guards[0].angle = 0;
    s.guards[0].suspicion = 0.9;
    s.guards[0].state = 'chase';
    s.guards[1].x = 860;
    s.guards[1].y = 300;
    s.guards[1].angle = Math.PI * 0.75;
    s.guards[1].suspicion = 0.7;
    s.guards[2].x = 500;
    s.guards[2].y = 640;
    s.guards[2].angle = 0;
    s.guards[3].x = 1120;
    s.guards[3].y = 200;
    s.guards[3].angle = Math.PI;
    s.cameras[0].angle = Math.PI / 2 - 0.6;
    s.cameras[0].suspicion = 0.8;
    s.cameras[1].angle = Math.PI * 0.6;
    s.smokes = [{ x: 700, y: 480, until: 999999 }];
    s.message = 'Spotted! Break line of sight — now!';
    s.messageUntil = 999999;
    return { screen: SCREEN_PLAY, best: s.best };
  }
  if (name === 'end') {
    s.screen = SCREEN_ESCAPED;
    s.lootValue = 304000;
    s.lootTaken = 5;
    s.time = 167;
    s.timesSpotted = 2;
    s.alarmPeak = 61;
    return { screen: SCREEN_ESCAPED, best: s.best };
  }
  // Unknown shot: the plain title.
  s.screen = 'title';
  return { screen: 'title', best: s.best };
}
