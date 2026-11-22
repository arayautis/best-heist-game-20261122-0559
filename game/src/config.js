// Tuning for Meridian Vault — one screen, one night, one diamond.
// Every number the guards, cameras, tools and alarm obey lives here,
// so the feel can be retuned without touching the simulation.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TILE = 40;

export const PLAYER_SPEED = 168; // px per second, walking
export const PLAYER_SNEAK_SPEED = 96; // sneaking: slower, harder to spot
export const PLAYER_RADIUS = 13;

// How far a guard or camera can see, and how wide its cone opens.
export const GUARD_VIEW_DIST = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.46; // radians, ~26 degrees each side
export const CAMERA_VIEW_DIST = 265;
export const CAMERA_VIEW_HALF_ANGLE = 0.42;

// Suspicion 0..1 per watcher. It fills while the thief is seen and drains
// while hidden. Full suspicion trips the alarm and starts a chase.
export const SUSPICION_FILL_SEEN = 0.85; // per second, fully lit
export const SUSPICION_FILL_SNEAK = 0.38; // sneaking inside a cone
export const SUSPICION_FILL_EDGE = 0.45; // at the cone's rim
export const SUSPICION_DRAIN = 0.5; // per second while unseen
export const SUSPICION_CHASE_AT = 1;

// Alarm 0..100. A trip adds a chunk; it bleeds off slowly while unseen.
// At 100 the vault locks down and the run ends.
export const ALARM_TRIP_ADD = 26;
export const ALARM_DECAY = 1.6; // per second while no watcher sees the thief
export const ALARM_LOCKDOWN = 100;
export const ALARM_CAMERA_TRIP = 18;

// A chasing guard moves faster than the thief walks, slower than a sprint.
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 178;
export const GUARD_RADIUS = 14;
export const GUARD_CATCH_DIST = 26;
export const GUARD_GIVE_UP_SECS = 6; // unseen this long: back to patrol

export const CAMERA_SWEEP_SPEED = 0.55; // radians per second
export const CAMERA_SWEEP_ARC = 1.15; // radians either side of home

// Tools. EMP kills every camera for a while; smoke breaks line of sight.
export const EMP_CHARGES = 2;
export const EMP_DISABLE_SECS = 9;
export const SMOKE_CHARGES = 2;
export const SMOKE_RADIUS = 110;
export const SMOKE_SECS = 5;

// Lockpicking: hold E beside a locked prize. The diamond takes longest.
export const PICK_DIAMOND_SECS = 2.6;
export const PICK_SAFE_SECS = 3.4;
export const PICK_RANGE = 46;

// Loot values in dollars. The diamond is the job; the rest is the bonus.
export const LOOT = {
  diamond: 250000,
  painting: 18000,
  gold: 12000,
  safe: 45000,
};

export const BEST_KEY = 'meridian-vault-best';
export const STEP = 1 / 60;
