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
