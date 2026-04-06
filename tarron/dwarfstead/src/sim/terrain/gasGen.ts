/**
 * Gas generation orchestrator — places gas pockets throughout the terrain
 * during world generation.
 *
 * Pass 1: Imposed shapes (sealed pockets carved into rock, cave ceiling fills)
 * Pass 2: Opportunistic ceiling basin fill (fill existing enclosed ceilings)
 *
 * No archetype system — same density for all seeds. RNG makes each unique.
 * Gas is denser in deeper layers, sparse near surface.
 */

import { BlockMaterial } from '../types';
import type { SeededRNG } from '../rng';
import type { GasLayer } from '../gas/types';
import type { WaterLayer } from '../water/waterLayer';
import { VOLUME_PER_TILE, cloneGasLayers } from '../gas/gasLayer';
import type { PipeCell } from '../water/types';
import { GasPathSystem } from '../gas/GasPathSystem';
import type { LayerBoundaries } from './depthZones';
import { runImposedGasShapes } from './gasImposed';
import { fillGasBasins } from './gasBasinFill';

export interface GasGenConfig {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  bounds: LayerBoundaries;
  surfaceHeights: number[];
  surfaceY: number;
  rng: SeededRNG;
  /** Existing water layers — gas carving must not break water containment. */
  waterLayers: WaterLayer[];
}

export interface GasDensity {
  // Imposed sealed pocket counts per zone [min, max]
  sealedPockets_shallow: [number, number];
  sealedPockets_midStone: [number, number];
  sealedPockets_darkStone: [number, number];
  sealedPockets_cavern: [number, number];

  // Basin fill probability per zone (higher = more gas)
  basinFillChance_shallow: number;
  basinFillChance_midStone: number;
  basinFillChance_darkStone: number;
  basinFillChance_cavern: number;

  // Cave ceiling gas fill probability per zone
  caveCeilingGas_shallow: number;
  caveCeilingGas_midStone: number;
  caveCeilingGas_darkStone: number;
  caveCeilingGas_cavern: number;
}

const DENSITY: GasDensity = {
  sealedPockets_shallow:   [0, 1],
  sealedPockets_midStone:  [1, 3],
  sealedPockets_darkStone: [2, 5],
  sealedPockets_cavern:    [3, 6],

  basinFillChance_shallow:   0.05,
  basinFillChance_midStone:  0.15,
  basinFillChance_darkStone: 0.30,
  basinFillChance_cavern:    0.40,

  caveCeilingGas_shallow:   0.03,
  caveCeilingGas_midStone:  0.10,
  caveCeilingGas_darkStone: 0.20,
  caveCeilingGas_cavern:    0.30,
};

export function generateGas(cfg: GasGenConfig): GasLayer[] {
  const layers: GasLayer[] = [];

  // Pass 1: Imposed shapes (sealed pockets + cave ceiling fills)
  runImposedGasShapes(cfg, DENSITY, layers);

  // Pass 2: Opportunistic ceiling basin fill
  fillGasBasins(cfg, DENSITY, layers);

  // Deduplicate: merge layers that share the same (y, left, right)
  dedupLayers(layers);

  // Pass 3: Settle — run gas sim until stable. No active paths at map start.
  return settleAllGas(cfg, layers);
}

/** Merge duplicate layers sharing (y, left, right), sum volumes capped at capacity. */
function dedupLayers(layers: GasLayer[]): void {
  const map = new Map<string, number>();
  let write = 0;
  for (let read = 0; read < layers.length; read++) {
    const l = layers[read];
    const k = `${l.y},${l.left},${l.right}`;
    const existing = map.get(k);
    if (existing !== undefined) {
      const cap = (l.right - l.left + 1) * VOLUME_PER_TILE;
      layers[existing].volume = Math.min(layers[existing].volume + l.volume, cap);
    } else {
      map.set(k, write);
      if (write !== read) layers[write] = l;
      write++;
    }
  }
  layers.length = write;
}

const MAX_SETTLE_TICKS = 1000;

function settleAllGas(cfg: GasGenConfig, layers: GasLayer[]): GasLayer[] {
  const { width, height, blocks } = cfg;
  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < height; y++) pipes.push(new Array(width).fill(null));

  const system = new GasPathSystem({
    width, height, blocks, pipes, initialGasVolume: layers,
  });

  for (let i = 0; i < MAX_SETTLE_TICKS; i++) {
    system.update();
    if (!system.active) break;
  }

  // Safety: remove sinking gas layers (air above with no gas above — not clinging to ceiling)
  const settled = cloneGasLayers(system.state.gasLayers);
  let prev = settled.length + 1;
  while (settled.length < prev) {
    prev = settled.length;
    for (let i = settled.length - 1; i >= 0; i--) {
      if (isLayerSinking(settled[i], settled, blocks)) {
        settled.splice(i, 1);
      }
    }
  }
  return settled.filter(l => l.volume > 0);
}

/** A gas layer is "sinking" if it has air above with no gas layer above (not clinging to ceiling). */
function isLayerSinking(
  layer: GasLayer, layers: GasLayer[], blocks: BlockMaterial[][],
): boolean {
  if (layer.volume <= 0) return true;
  if (layer.y - 1 < 0) return false; // world top = ceiling
  for (let x = layer.left; x <= layer.right; x++) {
    if (blocks[layer.y - 1][x] !== BlockMaterial.Air) continue;
    const above = layers.find(
      l => l !== layer && l.y === layer.y - 1 && l.left <= x && l.right >= x && l.volume > 0,
    );
    if (!above) return true;
  }
  return false;
}
