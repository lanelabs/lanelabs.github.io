import { SeededRNG } from '../rng';

/**
 * Simple 2D value noise with linear interpolation.
 * No external dependencies — uses SeededRNG for determinism.
 */
export class ValueNoise2D {
  private grid: number[][];
  private gridW: number;
  private gridH: number;

  constructor(rng: SeededRNG, gridW: number, gridH: number) {
    this.gridW = gridW;
    this.gridH = gridH;
    this.grid = [];
    for (let y = 0; y <= gridH; y++) {
      const row: number[] = [];
      for (let x = 0; x <= gridW; x++) {
        row.push(rng.next());
      }
      this.grid.push(row);
    }
  }

  /** Sample noise at a point, returning a value in [0, 1). */
  sample(x: number, y: number): number {
    // Map coordinates into grid space
    const gx = (x / this.gridW) * this.gridW;
    const gy = (y / this.gridH) * this.gridH;

    const x0 = Math.floor(gx) % this.gridW;
    const y0 = Math.floor(gy) % this.gridH;
    const x1 = (x0 + 1) % (this.gridW + 1);
    const y1 = (y0 + 1) % (this.gridH + 1);

    const fx = gx - Math.floor(gx);
    const fy = gy - Math.floor(gy);

    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const top = this.grid[y0][x0] * (1 - sx) + this.grid[y0][x1] * sx;
    const bot = this.grid[y1][x0] * (1 - sx) + this.grid[y1][x1] * sx;

    return top * (1 - sy) + bot * sy;
  }
}

export interface FractalNoiseConfig {
  octaves: number;
  baseFreq: number;
  amplitude: number;
  persistence: number;
}

/**
 * Generate 1D fractal brownian motion surface offsets by layering
 * multiple octaves of ValueNoise2D.
 *
 * Returns number[] of length `width` with values centered around 0.
 */
export function fractalNoise1D(
  rng: SeededRNG, width: number, config: FractalNoiseConfig,
): number[] {
  const { octaves, baseFreq, amplitude, persistence } = config;
  const offsets = new Array<number>(width).fill(0);

  let amp = amplitude / 2; // first octave amplitude
  let freq = baseFreq;

  for (let o = 0; o < octaves; o++) {
    const noise = new ValueNoise2D(rng, Math.max(2, Math.ceil(freq)), 1);
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * freq;
      // Noise returns [0,1), shift to [-0.5, 0.5) then scale by amplitude
      offsets[x] += (noise.sample(nx, 0) - 0.5) * 2 * amp;
    }
    freq *= 2;
    amp *= persistence;
  }

  return offsets;
}

/**
 * Evaluate a Catmull-Rom spline at parameter t ∈ [0, 1].
 * `points` is an array of y-values evenly spaced along the curve.
 * Returns an interpolated y-value that passes through every control point.
 */
export function catmullRomSpline(points: number[], t: number): number {
  const n = points.length;
  if (n < 2) return points[0] ?? 0;

  // Map t to segment index
  const seg = t * (n - 1);
  const i = Math.min(Math.floor(seg), n - 2);
  const f = seg - i;

  // Four control points with clamped boundary
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(n - 1, i + 1)];
  const p3 = points[Math.min(n - 1, i + 2)];

  // Catmull-Rom basis (tau = 0.5)
  const f2 = f * f;
  const f3 = f2 * f;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * f +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * f3
  );
}
