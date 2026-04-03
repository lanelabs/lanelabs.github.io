/**
 * Water generation orchestrator — selects a per-map archetype and runs
 * three passes to populate the terrain with water bodies.
 *
 * Pass 1: Imposed shapes (ocean, lake, pond, underground features)
 * Pass 2: Opportunistic basin fill (flood existing enclosed caves)
 * Pass 3: Historical rainfall (settle droplets downhill into basins)
 */

import { BlockMaterial } from '../types';
import type { SeededRNG } from '../rng';
import type { WaterLayer } from '../water/waterLayer';
import { cloneLayers, VOLUME_PER_TILE } from '../water/waterLayer';
import type { PipeCell } from '../water/types';
import { WaterPathSystem } from '../water/WaterPathSystem';
import type { LayerBoundaries } from './depthZones';
import { runImposedShapes } from './waterImposed';
import { fillBasins, settleRainfall } from './waterBasinFill';

export type WaterArchetype = 'oceanic' | 'lush' | 'arid' | 'flooded_depths';

export interface WaterGenConfig {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  bounds: LayerBoundaries;
  surfaceHeights: number[];
  surfaceY: number;
  rng: SeededRNG;
}

export interface ArchetypeDensity {
  oceanChance: number;
  lakeCount: [number, number];
  pondCount: [number, number];
  shallowCaveFloodPct: number;
  aquiferBands: [number, number];
  undergroundLakes: [number, number];
  tunnelFloodPct: number;
  cavernLakes: [number, number];
  submergedPassages: [number, number];
  darkStoneAquiferPct: number;
  rainfallDroplets: number;
  basinFillFraction: number;
}

const DENSITIES: Record<WaterArchetype, ArchetypeDensity> = {
  oceanic: {
    oceanChance: 0.9, lakeCount: [1, 3], pondCount: [3, 6],
    shallowCaveFloodPct: 0.3, aquiferBands: [1, 2], undergroundLakes: [1, 3],
    tunnelFloodPct: 0.15, cavernLakes: [1, 3], submergedPassages: [1, 2],
    darkStoneAquiferPct: 0.2, rainfallDroplets: 100, basinFillFraction: 0.5,
  },
  lush: {
    oceanChance: 0.0, lakeCount: [2, 5], pondCount: [4, 8],
    shallowCaveFloodPct: 0.4, aquiferBands: [1, 3], undergroundLakes: [2, 4],
    tunnelFloodPct: 0.25, cavernLakes: [2, 3], submergedPassages: [1, 2],
    darkStoneAquiferPct: 0.2, rainfallDroplets: 150, basinFillFraction: 0.6,
  },
  arid: {
    oceanChance: 0.0, lakeCount: [1, 2], pondCount: [2, 4],
    shallowCaveFloodPct: 0.15, aquiferBands: [0, 1], undergroundLakes: [1, 2],
    tunnelFloodPct: 0.05, cavernLakes: [1, 2], submergedPassages: [0, 1],
    darkStoneAquiferPct: 0.05, rainfallDroplets: 40, basinFillFraction: 0.25,
  },
  flooded_depths: {
    oceanChance: 0.0, lakeCount: [1, 2], pondCount: [1, 3],
    shallowCaveFloodPct: 0.3, aquiferBands: [1, 2], undergroundLakes: [3, 5],
    tunnelFloodPct: 0.35, cavernLakes: [3, 5], submergedPassages: [2, 4],
    darkStoneAquiferPct: 0.45, rainfallDroplets: 80, basinFillFraction: 0.7,
  },
};

const ARCHETYPES: WaterArchetype[] = ['oceanic', 'lush', 'arid', 'flooded_depths'];
const ARCHETYPE_WEIGHTS = [0.2, 0.4, 0.2, 0.2];

function pickArchetype(rng: SeededRNG): WaterArchetype {
  const r = rng.next();
  let cum = 0;
  for (let i = 0; i < ARCHETYPES.length; i++) {
    cum += ARCHETYPE_WEIGHTS[i];
    if (r < cum) return ARCHETYPES[i];
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

export function generateWater(cfg: WaterGenConfig): WaterLayer[] {
  const archetype = pickArchetype(cfg.rng);
  const density = DENSITIES[archetype];
  const layers: WaterLayer[] = [];

  // Pass 1: Imposed shapes
  runImposedShapes(cfg, density, layers);

  // Pass 2: Opportunistic basin fill
  fillBasins(cfg, density, layers);

  // Pass 3: Historical rainfall
  settleRainfall(cfg, density, layers);

  // Deduplicate: merge layers that share the same (y, left, right)
  dedupLayers(layers);

  // Pass 4: Settle — run the water sim until all water is in stable pools.
  // On map load there must be zero active paths (no falling/flowing water).
  return settleAllWater(cfg, layers);
}

/** Merge duplicate layers sharing (y, left, right), sum volumes capped at capacity. */
function dedupLayers(layers: WaterLayer[]): void {
  const map = new Map<string, number>(); // key → index in layers
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

function settleAllWater(cfg: WaterGenConfig, layers: WaterLayer[]): WaterLayer[] {
  const { width, height, blocks } = cfg;
  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < height; y++) pipes.push(new Array(width).fill(null));

  const system = new WaterPathSystem({
    width, height, blocks, pipes, initialWaterVolume: layers,
  });

  for (let i = 0; i < MAX_SETTLE_TICKS; i++) {
    system.update();
    if (!system.active) break;
  }

  // Safety net: remove any layers that are floating (air below, no water below).
  // Cascade: removing one layer can make the layer above it float too.
  const settled = cloneLayers(system.state.waterLayers);
  let prev = settled.length + 1;
  while (settled.length < prev) {
    prev = settled.length;
    for (let i = settled.length - 1; i >= 0; i--) {
      if (isLayerFloating(settled[i], settled, blocks, height)) {
        settled.splice(i, 1);
      }
    }
  }
  return settled.filter(l => l.volume > 0);
}

function isLayerFloating(
  layer: WaterLayer, layers: WaterLayer[],
  blocks: BlockMaterial[][], h: number,
): boolean {
  if (layer.volume <= 0) return true;
  if (layer.y + 1 >= h) return false;
  for (let x = layer.left; x <= layer.right; x++) {
    if (blocks[layer.y + 1][x] !== BlockMaterial.Air) continue;
    const below = layers.find(
      l => l !== layer && l.y === layer.y + 1 && l.left <= x && l.right >= x && l.volume > 0,
    );
    if (!below) return true;
  }
  return false;
}
