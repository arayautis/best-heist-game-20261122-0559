// The Grand Meridian Museum, one floor, one night.
// Walls are rectangles; loot, guards and cameras are placed on the floor.
// The vault (top right) holds the Grand Diamond. The safe room (top left)
// holds the safe. The gallery in the middle holds the paintings. The gold
// room (mid right) holds the gold. The getaway door is bottom left.
// A vent shaft runs along the top, safe room to vault, for a quiet route.
import { LOOT } from './config.js';

export function createLevel() {
  const walls = [
    // Outer shell (the exit door leaves a gap in the left wall).
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 620 },
    { x: 0, y: 660, w: 24, h: 60 },
    { x: 1256, y: 0, w: 24, h: 720 },
    // Safe room (top left): right wall with a vent gap, bottom wall with a door.
    { x: 300, y: 24, w: 20, h: 36 },
    { x: 300, y: 88, w: 20, h: 132 },
    { x: 24, y: 220, w: 176, h: 20 },
    { x: 240, y: 220, w: 80, h: 20 },
    // Vent shaft along the top: its floor is the crawl space.
    { x: 320, y: 88, w: 620, h: 16 },
    // Vault room (top right): left wall with vent gap + door gap, bottom wall.
    { x: 940, y: 24, w: 20, h: 36 },
    { x: 940, y: 88, w: 20, h: 86 },
    { x: 940, y: 214, w: 20, h: 46 },
    { x: 940, y: 260, w: 316, h: 20 },
    // Gold room (mid right): left wall with a door gap, bottom wall.
    { x: 940, y: 280, w: 20, h: 120 },
    { x: 940, y: 440, w: 20, h: 100 },
    { x: 940, y: 540, w: 316, h: 20 },
    // Bottom corridor: top wall with a door gap.
    { x: 320, y: 580, w: 280, h: 20 },
    { x: 660, y: 580, w: 280, h: 20 },
    // Gallery cover: crates, a desk and a statue plinth block sight.
    { x: 480, y: 320, w: 90, h: 60 },
    { x: 700, y: 300, w: 60, h: 90 },
    { x: 560, y: 440, w: 110, h: 50 },
    { x: 380, y: 420, w: 80, h: 44 },
    { x: 820, y: 360, w: 44, h: 44 },
  ];

  // The vent shaft: crouched low, the thief is hard to spot here.
  const vents = [{ x: 320, y: 48, w: 620, h: 40 }];

  const loot = [
    { id: 'diamond', kind: 'diamond', x: 1120, y: 150, value: LOOT.diamond, locked: true, taken: false, label: 'Grand Diamond' },
    { id: 'safe', kind: 'safe', x: 150, y: 120, value: LOOT.safe, locked: true, taken: false, label: 'Wall Safe' },
    { id: 'painting1', kind: 'painting', x: 520, y: 118, value: LOOT.painting, locked: false, taken: false, label: 'Portrait of the Duchess' },
    { id: 'painting2', kind: 'painting', x: 760, y: 118, value: LOOT.painting, locked: false, taken: false, label: 'The Gilded Harbour' },
    { id: 'painting3', kind: 'painting', x: 620, y: 556, value: LOOT.painting, locked: false, taken: false, label: 'Midnight over Meridian' },
    { id: 'gold1', kind: 'gold', x: 1100, y: 430, value: LOOT.gold, locked: false, taken: false, label: 'Gold Bars' },
    { id: 'gold2', kind: 'gold', x: 1180, y: 480, value: LOOT.gold, locked: false, taken: false, label: 'Gold Bars' },
  ];

  const guards = [
    {
      name: 'Marco', x: 400, y: 300, angle: 0, state: 'patrol', suspicion: 0,
      waypoints: [[400, 300], [860, 300], [860, 480], [400, 480]],
      waypointIndex: 1, chaseTime: 0, lastSeenX: 0, lastSeenY: 0,
    },
    {
      name: 'Iris', x: 420, y: 150, angle: 0, state: 'patrol', suspicion: 0,
      waypoints: [[420, 150], [900, 150]],
      waypointIndex: 1, chaseTime: 0, lastSeenX: 0, lastSeenY: 0,
    },
    {
      name: 'Dmitri', x: 200, y: 640, angle: 0, state: 'patrol', suspicion: 0,
      waypoints: [[200, 640], [1150, 640]],
      waypointIndex: 1, chaseTime: 0, lastSeenX: 0, lastSeenY: 0,
    },
    {
      name: 'Sofia', x: 1000, y: 120, angle: 0, state: 'patrol', suspicion: 0,
      waypoints: [[1000, 120], [1200, 120], [1200, 220], [1000, 220]],
      waypointIndex: 1, chaseTime: 0, lastSeenX: 0, lastSeenY: 0,
    },
  ];

  const cameras = [
    { id: 'cam1', x: 640, y: 106, home: Math.PI / 2, angle: Math.PI / 2, sweep: 1, disabledUntil: 0, suspicion: 0, label: 'Gallery Cam' },
    { id: 'cam2', x: 1248, y: 60, home: Math.PI * 0.75, angle: Math.PI * 0.75, sweep: 1, disabledUntil: 0, suspicion: 0, label: 'Vault Cam' },
    { id: 'cam3', x: 1240, y: 620, home: Math.PI, angle: Math.PI, sweep: -1, disabledUntil: 0, suspicion: 0, label: 'Corridor Cam' },
  ];

  return {
    walls,
    vents,
    loot,
    guards,
    cameras,
    spawn: { x: 64, y: 640 },
    exit: { x: 24, y: 620, w: 56, h: 40 },
  };
}
