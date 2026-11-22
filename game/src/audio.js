// Synthesised sound: no audio files ship with the game, every cue is an
// oscillator shaped in code. The context starts on the first key press,
// because browsers will not let audio run before the player acts.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gainValue, when = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    // A soft coin-chime when loot is lifted.
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.18, 'sine', 0.1, 0.07);
    },
    // A low two-note warning when a watcher first grows suspicious.
    spotted() {
      tone(220, 0.16, 'square', 0.07);
      tone(175, 0.22, 'square', 0.07, 0.12);
    },
    // The alarm trip: a rising siren edge.
    alarm() {
      tone(440, 0.3, 'sawtooth', 0.06);
      tone(660, 0.3, 'sawtooth', 0.06, 0.16);
    },
    // The EMP burst: a short filtered zap.
    emp() {
      tone(1200, 0.25, 'sawtooth', 0.08);
      tone(300, 0.3, 'sawtooth', 0.08, 0.05);
    },
    // Lockpick clicks, one per second of picking.
    click() {
      tone(1500, 0.05, 'square', 0.05);
    },
    // Caught: a short descending sting.
    caught() {
      tone(392, 0.25, 'triangle', 0.12);
      tone(311, 0.25, 'triangle', 0.12, 0.2);
      tone(233, 0.5, 'triangle', 0.12, 0.4);
    },
    // Escaped: a small major fanfare.
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'sine', 0.11, i * 0.12));
    },
  };
}
