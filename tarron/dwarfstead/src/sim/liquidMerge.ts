/**
 * Shared liquid merge helpers for gas and water systems.
 *
 * Determines when instant pool recombination should happen (block removal
 * between two pools, contained pocket) vs gradual flow, and detects when
 * gradual flow has filled a layer that bridges two separate pools.
 */

/** Minimal layer interface shared by GasLayer and WaterLayer. */
interface LiquidLayer {
  y: number;
  left: number;
  right: number;
  volume: number;
}

/** Find the layer covering tile (x, y), or null. */
function findLayerAt(layers: LiquidLayer[], x: number, y: number): LiquidLayer | null {
  for (const l of layers) {
    if (l.y === y && x >= l.left && x <= l.right) return l;
  }
  return null;
}

/**
 * Check if a tile has liquid on opposite sides (vertical or horizontal).
 * Used by onBlockRemoved to detect if a removed tile bridges two pools.
 */
export function isBetweenTwoLayers(
  x: number, y: number,
  layers: LiquidLayer[],
): boolean {
  const gU = findLayerAt(layers, x, y - 1);
  const gD = findLayerAt(layers, x, y + 1);
  const gL = findLayerAt(layers, x - 1, y);
  const gR = findLayerAt(layers, x + 1, y);
  const betweenV = !!(gU && gU.volume > 0 && gD && gD.volume > 0);
  const betweenH = !!(gL && gL.volume > 0 && gR && gR.volume > 0);
  return betweenV || betweenH;
}

/**
 * Check if the layer at (x, y) has liquid both above and below
 * with horizontal overlap — meaning it bridges two separate pools.
 * Used after teleport to detect when gradual flow connects pools.
 */
export function layerBridgesLiquid(
  x: number, y: number,
  layers: LiquidLayer[],
): boolean {
  const layer = findLayerAt(layers, x, y);
  if (!layer || layer.volume <= 0) return false;

  let hasAbove = false;
  let hasBelow = false;

  for (const l of layers) {
    if (l === layer || l.volume <= 0) continue;
    // Must overlap horizontally
    if (l.left > layer.right || l.right < layer.left) continue;
    if (l.y === layer.y - 1) hasAbove = true;
    if (l.y === layer.y + 1) hasBelow = true;
    if (hasAbove && hasBelow) return true;
  }

  return false;
}
