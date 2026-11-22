// Keyboard and mouse: WASD or arrows to move, Shift to sneak, E to pick
// a lock or lift loot, 1 for the EMP, 2 for a smoke pellet, P to pause,
// M to mute, Enter to confirm on the title and end screens.
// The mouse is used on the title screen's buttons and to click the
// on-screen tool buttons; movement itself is keyboard-only by design.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_EMP = 'emp';
export const ACTION_SMOKE = 'smoke';

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
  Digit1: 'emp', Digit2: 'smoke',
  KeyP: 'pause', Escape: 'pause',
  KeyM: 'mute',
  Enter: 'confirm', Space: 'confirm',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    held.delete(action);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }

  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    held,
    // True only on the frame the key went down; the world consumes it.
    wasPressed(action) {
      return pressed.has(action);
    },
    consumePressed(action) {
      pressed.delete(action);
    },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
    get mouse() {
      return mouse;
    },
    axis() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
  };
}
