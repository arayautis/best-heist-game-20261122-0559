// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens:
// title, play, paused, caught and escaped.
//
// ?seed=N fixes the patrol jitter. ?shot=start|play|alarm|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_ALARM, EVENT_CAUGHT, EVENT_CLICK, EVENT_EMP,
  EVENT_PICKUP, EVENT_SPOTTED, EVENT_WIN, SCREEN_CAUGHT, SCREEN_ESCAPED,
  SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
} from './world.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

world.state.best = readBest();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
  return scene;
}

function drainEvents() {
  while (world.events.length > 0) {
    const event = world.events.shift();
    if (event === EVENT_PICKUP) audio.pickup();
    else if (event === EVENT_SPOTTED) audio.spotted();
    else if (event === EVENT_ALARM) audio.alarm();
    else if (event === EVENT_EMP) audio.emp();
    else if (event === EVENT_CLICK) audio.click();
    else if (event === EVENT_CAUGHT) audio.caught();
    else if (event === EVENT_WIN) {
      audio.win();
      if (world.state.lootValue > world.state.best) {
        world.state.best = world.state.lootValue;
        saveBest(world.state.best);
      }
    }
  }
}

if (shot) {
  runShot(shot);
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    acc += elapsed;
    const s = world.state;
    if (input.wasPressed('mute')) {
      const muted = audio.toggleMute();
      if (s.screen === SCREEN_PLAY) world.say(muted ? 'Sound off.' : 'Sound on.', 1.5);
    }
    if (input.wasPressed('confirm')) {
      audio.unlock();
      if (s.screen === SCREEN_TITLE) world.start();
      else if (s.screen === SCREEN_CAUGHT || s.screen === SCREEN_ESCAPED) {
        world.reset();
        world.state.screen = SCREEN_TITLE;
      }
    }
    if (input.wasPressed('pause') && (s.screen === SCREEN_PLAY || s.screen === SCREEN_PAUSED)) {
      s.screen = s.screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    }
    while (acc >= STEP) {
      world.update(STEP, input);
      acc -= STEP;
    }
    drainEvents();
    renderer.draw(s, now / 1000);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
