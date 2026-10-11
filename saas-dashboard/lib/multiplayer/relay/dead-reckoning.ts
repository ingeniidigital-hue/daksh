export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Velocity3 {
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Calculates projected position based on initial position, velocity, and delta time (seconds).
 * Formula: P_t = P_0 + (V * dt)
 */
export function calculateDeadReckoning(
  initialPos: Vector3,
  velocity: Velocity3,
  deltaTimeSeconds: number
): Vector3 {
  return {
    x: initialPos.x + velocity.vx * deltaTimeSeconds,
    y: initialPos.y + velocity.vy * deltaTimeSeconds,
    z: initialPos.z + velocity.vz * deltaTimeSeconds
  };
}

/**
 * Performs linear interpolation (LERP) between two vectors for smooth visual updates.
 */
export function lerpVector3(from: Vector3, to: Vector3, t: number): Vector3 {
  const clampT = Math.max(0, Math.min(1, t));
  return {
    x: from.x + (to.x - from.x) * clampT,
    y: from.y + (to.y - from.y) * clampT,
    z: from.z + (to.z - from.z) * clampT
  };
}
