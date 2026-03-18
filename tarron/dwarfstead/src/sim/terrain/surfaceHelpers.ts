import { SeededRNG } from '../rng';

export const MIN_FEATURE_WIDTH = 3;

/** Remove thin spikes/dips: any column that differs from both neighbors gets averaged. */
export function smoothSpikes(heights: number[]): void {
  const len = heights.length;
  const snap = heights.slice();
  for (let x = 1; x < len - 1; x++) {
    const l = snap[x - 1], c = snap[x], r = snap[x + 1];
    // Spike: column sticks up (lower Y) or dips down (higher Y) vs both neighbors
    const isSpike = (c < l && c < r) || (c > l && c > r);
    if (isSpike) {
      heights[x] = Math.round((l + r) / 2);
    }
  }
}

/** Smooth sharp cliff edges with gradual transitions. */
export function roundCliffs(heights: number[], minWidth: number): void {
  const snap = heights.slice(); // detect cliffs from original values
  const len = heights.length;

  for (let x = 0; x < len - 1; x++) {
    const diff = snap[x + 1] - snap[x];
    const absDiff = Math.abs(diff);
    if (absDiff <= 1) continue;

    const desiredRadius = absDiff <= 3 ? 1 : Math.min(3, Math.floor(absDiff / 2));

    // Left flat run length (columns at snap[x] extending left from x)
    let leftRun = 1;
    while (x - leftRun >= 0 && snap[x - leftRun] === snap[x]) leftRun++;
    // Right flat run length (columns at snap[x+1] extending right from x+1)
    let rightRun = 1;
    while (x + 1 + rightRun < len && snap[x + 1 + rightRun] === snap[x + 1]) rightRun++;

    // Always allow at least 1 block of rounding; only reserve (minWidth-1) for the flat
    const leftBudget = Math.max(1, leftRun - (minWidth - 1));
    const rightBudget = Math.max(1, rightRun - (minWidth - 1));
    const leftRadius = Math.min(desiredRadius, leftBudget);
    const rightRadius = Math.min(desiredRadius, rightBudget);

    const lo = Math.min(snap[x], snap[x + 1]);
    const hi = Math.max(snap[x], snap[x + 1]);
    const sign = diff > 0 ? 1 : -1; // direction of height change

    // Left-side rounding: adjust heights[x - i] toward the cliff
    for (let i = 0; i < leftRadius; i++) {
      const col = x - i;
      const step = (leftRadius - i) * sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }

    // Right-side rounding: adjust heights[x+1 + i] toward the cliff
    for (let i = 0; i < rightRadius; i++) {
      const col = x + 1 + i;
      const step = (rightRadius - i) * -sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }
  }
}

/**
 * Inject hard cliff features by shifting one side of the terrain down.
 * Each cliff creates exactly one sheer face — the natural terrain texture
 * is preserved on both sides, just at different elevations.
 */
export function injectCliffs(heights: number[], rng: SeededRNG): void {
  const len = heights.length;
  // 0–3 cliffs, weighted: 15% none, 40% one, 30% two, 15% three
  const r = rng.next();
  const count = r < 0.15 ? 0 : r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
  if (count === 0) return;

  // Collect cliff positions spread across the map
  const usable = len * 0.7;
  const margin = len * 0.15;
  const zoneWidth = usable / count;
  const cliffs: { x: number; drop: number }[] = [];

  for (let c = 0; c < count; c++) {
    const zoneStart = margin + c * zoneWidth;
    const cliffX = Math.floor(zoneStart + rng.next() * zoneWidth);
    if (cliffX < 1 || cliffX >= len - 1) continue;
    const drop = 8 + Math.floor(rng.next() * 18); // 8–25 blocks
    cliffs.push({ x: cliffX, drop });
  }
  cliffs.sort((a, b) => a.x - b.x);

  // Apply: shift all columns right of each cliff down by `drop`
  // Process right-to-left so shifts don't compound unexpectedly
  for (let i = cliffs.length - 1; i >= 0; i--) {
    const { x, drop } = cliffs[i];
    for (let col = x + 1; col < len; col++) {
      heights[col] += drop;
    }
  }
}

/** Widen any peak or canyon narrower than `minWidth` columns. */
export function widenExtrema(heights: number[], minWidth: number): void {
  const len = heights.length;
  for (let pass = 0; pass < 3; pass++) {
    // Find runs of equal height, check if the run is a local extremum
    let x = 0;
    while (x < len) {
      const h = heights[x];
      const lo = x;
      while (x < len && heights[x] === h) x++;
      const hi = x - 1; // inclusive end of run
      const w = hi - lo + 1;
      if (w >= minWidth) continue;
      const leftH = lo > 0 ? heights[lo - 1] : h;
      const rightH = hi < len - 1 ? heights[hi + 1] : h;
      // Peak: run is lower Y (higher ground) than both neighbors
      // Canyon: run is higher Y (lower ground) than both neighbors
      const isPeak = h < leftH && h < rightH;
      const isCanyon = h > leftH && h > rightH;
      if (!isPeak && !isCanyon) continue;
      const need = minWidth - w;
      const addL = Math.ceil(need / 2);
      const addR = need - addL;
      for (let i = 1; i <= addL && lo - i >= 0; i++) heights[lo - i] = h;
      for (let i = 1; i <= addR && hi + i < len; i++) heights[hi + i] = h;
    }
  }
}
