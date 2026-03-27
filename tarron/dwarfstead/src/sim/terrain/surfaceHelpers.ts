import { SeededRNG } from '../rng';

export const MIN_FEATURE_WIDTH = 5;

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

/**
 * Build a gradient baseline that skips narrow peaks and valleys.
 * For each column, compare it to the terrain `radius` columns away on
 * each side. If the column is significantly higher or lower than BOTH
 * reference points, it's part of a narrow feature and gets interpolated
 * toward the reference level.
 */
export function computeGradientLine(heights: number[], minWidth: number): number[] {
  const line = heights.slice();
  const len = line.length;
  const radius = minWidth + 1; // look 4 columns out on each side
  const minDev = 3;            // ignore features < 3 blocks tall

  for (let pass = 0; pass < 2; pass++) {
    const snap = line.slice();
    for (let x = 0; x < len; x++) {
      const h = snap[x];
      const leftRef = snap[Math.max(0, x - radius)];
      const rightRef = snap[Math.min(len - 1, x + radius)];
      const isPeak = h < leftRef - minDev && h < rightRef - minDev;
      const isValley = h > leftRef + minDev && h > rightRef + minDev;
      if (!isPeak && !isValley) continue;

      // Blend toward the average of the two reference heights
      const avg = (leftRef + rightRef) / 2;
      line[x] = Math.round(avg);
    }
  }
  return line;
}

/** Apply rounding to a height array in-place. */
function applyRounding(heights: number[]): void {
  const snap = heights.slice();
  const len = heights.length;

  for (let x = 0; x < len - 1; x++) {
    const diff = snap[x + 1] - snap[x];
    const absDiff = Math.abs(diff);
    if (absDiff <= 1) continue;

    const minRadius = absDiff <= 4 ? 1 : absDiff <= 12 ? 2 : 3;
    const desiredRadius = Math.max(minRadius, Math.min(3, Math.floor(absDiff / 2)));
    const leftRadius = Math.min(desiredRadius, x + 1);
    const rightRadius = Math.min(desiredRadius, len - x - 1);

    const lo = Math.min(snap[x], snap[x + 1]);
    const hi = Math.max(snap[x], snap[x + 1]);
    const sign = diff > 0 ? 1 : -1;

    for (let i = 0; i < leftRadius; i++) {
      const col = x - i;
      const step = (leftRadius - i) * sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }

    for (let i = 0; i < rightRadius; i++) {
      const col = x + 1 + i;
      const step = (rightRadius - i) * -sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }
  }
}

/**
 * Smooth sharp cliff edges with gradual transitions.
 * Rounding is computed on a gradient line that bypasses thin features
 * (< MIN_FEATURE_WIDTH wide), then the same deltas are applied to the
 * actual surface. This prevents rounding from creating sharp peaks
 * when it hits narrow spires or holes from both sides.
 */
export function roundCliffs(heights: number[]): void {
  const gradient = computeGradientLine(heights, MIN_FEATURE_WIDTH);
  const before = gradient.slice();
  applyRounding(gradient);
  for (let x = 0; x < heights.length; x++) {
    heights[x] += gradient[x] - before[x];
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

  // Apply: shift one side of each cliff down by `drop`, direction randomized
  // Process outside-in so shifts don't compound unexpectedly
  for (let i = cliffs.length - 1; i >= 0; i--) {
    const { x, drop } = cliffs[i];
    const dropRight = rng.next() > 0.5;
    if (dropRight) {
      for (let col = x + 1; col < len; col++) heights[col] += drop;
    } else {
      for (let col = x - 1; col >= 0; col--) heights[col] += drop;
    }
  }
}

/**
 * Walk every horizontal row and flag any run of sky or ground shorter
 * than `minWidth`. Returns an array of violations (empty = clean).
 */
export function validateMinWidth(
  surfaceHeights: number[], minWidth: number, mapHeight: number,
): { y: number; x: number; type: 'sky' | 'ground'; width: number }[] {
  const violations: { y: number; x: number; type: 'sky' | 'ground'; width: number }[] = [];
  const len = surfaceHeights.length;

  for (let y = 0; y < mapHeight; y++) {
    let runStart = 0;
    let runIsSky = y < surfaceHeights[0];

    for (let x = 1; x <= len; x++) {
      const isSky = x < len ? y < surfaceHeights[x] : !runIsSky; // force flush at end
      if (isSky === runIsSky) continue;
      const w = x - runStart;
      // Only flag interior runs (ignore runs touching map edges)
      if (w < minWidth && runStart > 0 && x < len) {
        violations.push({ y, x: runStart, type: runIsSky ? 'sky' : 'ground', width: w });
      }
      runStart = x;
      runIsSky = isSky;
    }
  }
  return violations;
}

/**
 * Widen any peak or canyon narrower than `minWidth` columns,
 * then add a 1-block "chip" transition on each outer edge so
 * rounding has room to create smooth tops/bottoms.
 */
export function widenExtrema(heights: number[], minWidth: number): void {
  const len = heights.length;
  for (let pass = 0; pass < 3; pass++) {
    let x = 0;
    while (x < len) {
      const h = heights[x];
      const lo = x;
      while (x < len && heights[x] === h) x++;
      const hi = x - 1;
      const w = hi - lo + 1;
      if (w >= minWidth) continue;
      const leftH = lo > 0 ? heights[lo - 1] : h;
      const rightH = hi < len - 1 ? heights[hi + 1] : h;
      const isPeak = h < leftH && h < rightH;
      const isCanyon = h > leftH && h > rightH;
      if (!isPeak && !isCanyon) continue;
      const need = minWidth - w;
      const addL = Math.ceil(need / 2);
      const addR = need - addL;
      for (let i = 1; i <= addL && lo - i >= 0; i++) heights[lo - i] = h;
      for (let i = 1; i <= addR && hi + i < len; i++) heights[hi + i] = h;

      // Chip: 1-block transition step on each outer edge
      // For peaks (low Y = high ground): chip is 1 step toward neighbors (h+1)
      // For canyons (high Y = low ground): chip is 1 step toward neighbors (h-1)
      const chip = isPeak ? h + 1 : h - 1;
      const newLo = lo - addL;
      const newHi = hi + addR;
      if (newLo - 1 >= 0 && Math.abs(heights[newLo - 1] - h) > 1) {
        heights[newLo - 1] = chip;
      }
      if (newHi + 1 < len && Math.abs(heights[newHi + 1] - h) > 1) {
        heights[newHi + 1] = chip;
      }
    }
  }
}
