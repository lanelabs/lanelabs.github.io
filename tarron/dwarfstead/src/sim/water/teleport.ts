/**
 * Water teleport — moves water along pre-computed paths.
 *
 * Each tick, water is removed from the source pool and deposited
 * at each path branch's destination. Fork splitting divides volume
 * in half; the odd remainder alternates via a global toggle.
 *
 * Pipe networks enforce 1 volume/tick throughput: only one pipe path
 * per network teleports each tick.
 */

import { BlockMaterial } from '../types';
import type { WaterPath, PipeRoundRobin } from './types';
import type { WaterLayer } from './waterLayer';
import { findLayer, removeWater, addWater, VOLUME_PER_TILE } from './waterLayer';

const MAX_CASCADE = 100;

/**
 * Find the topmost non-empty water layer in the pool containing the
 * given layer y. Scans upward through connected air tiles.
 */
function findTopmostLayer(
  layers: WaterLayer[], blocks: BlockMaterial[][],
  x: number, startY: number,
): WaterLayer | null {
  let topmost: WaterLayer | null = null;
  for (let y = startY; y >= 0; y--) {
    if (blocks[y][x] !== BlockMaterial.Air) break;
    const l = findLayer(layers, x, y);
    if (l && l.volume > 0) topmost = l;
  }
  return topmost;
}

/**
 * Check whether a branch destination can accept water.
 * A submerged exit whose pool is full up to the terminal tile can't accept.
 */
function canBranchAccept(
  branch: import('./types').PathBranch,
  waterLayers: WaterLayer[],
): boolean {
  if (!branch.destination) return false;
  const layer = findLayer(waterLayers, branch.destination.x, branch.destination.y);
  if (!layer) return true; // no layer = air, can always accept
  const width = layer.right - layer.left + 1;
  return layer.volume < width * VOLUME_PER_TILE;
}

/**
 * Teleport water along all paths from the previous tick.
 * Modifies waterLayers in place.
 *
 * Pipe paths use round-robin to pick which exit branch receives water.
 * Terrain paths distribute to all branches (fork splitting).
 */
export function teleportWater(
  paths: WaterPath[],
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  forkToggle: boolean,
  pipeRoundRobin: Map<number, PipeRoundRobin>,
): void {
  const usedNetworks = new Set<number>();

  for (const path of paths) {
    // Enforce pipe network throughput: 1/tick per network
    if (path.networkId !== undefined) {
      if (usedNetworks.has(path.networkId)) continue;
      usedNetworks.add(path.networkId);
    }

    // Find source layer to drain from
    const sourceLayer = findTopmostLayer(
      waterLayers, blocks,
      path.sourceX,
      path.sourceLayerY,
    );
    if (!sourceLayer || sourceLayer.volume <= 0) continue;

    // Check if any branch has a valid destination
    const validBranches = path.branches.filter(b => b.destination !== null);
    if (validBranches.length === 0) continue;

    // Pipe paths use round-robin; terrain paths distribute to all
    if (path.networkId !== undefined) {
      teleportPipeRoundRobin(
        path, validBranches, sourceLayer,
        waterLayers, blocks, w, h, pipeRoundRobin,
      );
    } else {
      // Terrain: drain and distribute across all branches
      const available = Math.min(path.rate, sourceLayer.volume);
      const drained = removeWater(waterLayers, sourceLayer.left, sourceLayer.y, available);
      if (drained <= 0) continue;

      const deposited = distributeToBranches(
        path.branches, drained, waterLayers, blocks, w, h, forkToggle, 0,
      );
      const leftover = drained - deposited;
      if (leftover > 0) {
        addWater(waterLayers, blocks, sourceLayer.left, sourceLayer.y, leftover, w, h);
      }
    }
  }
}

/**
 * Round-robin dispatch for a pipe path.
 * Picks the next exit branch that can accept water, advances the index.
 */
function teleportPipeRoundRobin(
  path: WaterPath,
  validBranches: import('./types').PathBranch[],
  sourceLayer: WaterLayer,
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  pipeRoundRobin: Map<number, PipeRoundRobin>,
): void {
  const netId = path.networkId!;

  // Build exit key fingerprint for reset detection
  const exitKeys = validBranches
    .map(b => b.destination ? `${b.destination.x},${b.destination.y}` : '')
    .filter(k => k !== '');

  let rr = pipeRoundRobin.get(netId);
  if (!rr || !arraysEqual(rr.exitKeys, exitKeys)) {
    rr = { index: 0, exitKeys };
    pipeRoundRobin.set(netId, rr);
  }

  // Try each exit in round-robin order, skip those that can't accept
  for (let attempt = 0; attempt < validBranches.length; attempt++) {
    const idx = rr.index % validBranches.length;
    const branch = validBranches[idx];

    if (canBranchAccept(branch, waterLayers)) {
      const available = Math.min(path.rate, sourceLayer.volume);
      const drained = removeWater(waterLayers, sourceLayer.left, sourceLayer.y, available);
      if (drained > 0) {
        const dest = branch.destination!;
        const deposited = addWater(waterLayers, blocks, dest.x, dest.y, drained, w, h);
        const leftover = drained - deposited;
        if (leftover > 0) {
          addWater(waterLayers, blocks, sourceLayer.left, sourceLayer.y, leftover, w, h);
        }
      }
      rr.index = (idx + 1) % validBranches.length;
      return;
    }

    rr.index = (idx + 1) % validBranches.length;
  }
  // All exits full — no flow this tick
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Recursively distribute volume across branches.
 * At each fork, split in half. Odd remainder uses forkToggle.
 * Returns the total volume actually deposited.
 */
function distributeToBranches(
  branches: import('./types').PathBranch[],
  volume: number,
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  forkToggle: boolean,
  cascadeDepth: number,
): number {
  if (volume <= 0 || cascadeDepth > MAX_CASCADE) return 0;

  const valid = branches.filter(b => b.destination !== null);
  if (valid.length === 0) return 0;

  if (valid.length === 1) {
    const dest = valid[0].destination!;
    return addWater(waterLayers, blocks, dest.x, dest.y, volume, w, h);
  }

  // Multiple branches — split volume
  const perBranch = Math.floor(volume / valid.length);
  let remainder = volume - perBranch * valid.length;
  let totalDeposited = 0;

  for (let i = 0; i < valid.length; i++) {
    const dest = valid[i].destination!;
    let branchVol = perBranch;

    if (remainder > 0) {
      const getsExtra = forkToggle ? (i === 0) : (i === valid.length - 1);
      if (getsExtra) {
        branchVol += remainder;
        remainder = 0;
      }
    }

    if (branchVol > 0) {
      totalDeposited += addWater(waterLayers, blocks, dest.x, dest.y, branchVol, w, h);
    }
  }

  return totalDeposited;
}
