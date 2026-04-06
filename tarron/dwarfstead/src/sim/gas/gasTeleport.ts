/**
 * Gas teleport — moves gas along pre-computed paths.
 *
 * Mirror of water teleport.ts. Same volume transfer logic,
 * just using gas layer functions.
 */

import { BlockMaterial } from '../types';
import type { GasPath, PipeRoundRobin, PathBranch } from './types';
import type { GasLayer } from './types';
import { findGasLayer, removeGas, addGas, VOLUME_PER_TILE } from './gasLayer';

const MAX_CASCADE = 100;

/**
 * Find the bottommost non-empty gas layer in the pool containing
 * the given layer y. Scans downward (inverted from water's upward).
 */
function findBottommostLayer(
  layers: GasLayer[], blocks: BlockMaterial[][],
  x: number, startY: number, h: number,
): GasLayer | null {
  let bottommost: GasLayer | null = null;
  for (let y = startY; y < h; y++) {
    if (blocks[y][x] !== BlockMaterial.Air) break;
    const l = findGasLayer(layers, x, y);
    if (l && l.volume > 0) bottommost = l;
  }
  return bottommost;
}

function canBranchAccept(
  branch: PathBranch,
  gasLayers: GasLayer[],
): boolean {
  if (!branch.destination) return false;
  const layer = findGasLayer(gasLayers, branch.destination.x, branch.destination.y);
  if (!layer) return true;
  const width = layer.right - layer.left + 1;
  return layer.volume < width * VOLUME_PER_TILE;
}

export function teleportGas(
  paths: GasPath[],
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  forkToggle: boolean,
  pipeRoundRobin: Map<number, PipeRoundRobin>,
  deposits?: { x: number; y: number }[],
): void {
  const usedNetworks = new Set<number>();

  for (const path of paths) {
    if (path.networkId !== undefined) {
      if (usedNetworks.has(path.networkId)) continue;
      usedNetworks.add(path.networkId);
    }

    const sourceLayer = findBottommostLayer(
      gasLayers, blocks, path.sourceX, path.sourceLayerY, h,
    );
    if (!sourceLayer || sourceLayer.volume <= 0) continue;

    const validBranches = path.branches.filter(b => b.destination !== null);
    if (validBranches.length === 0) continue;

    if (path.networkId !== undefined) {
      teleportPipeRoundRobin(
        path, validBranches, sourceLayer,
        gasLayers, blocks, w, h, pipeRoundRobin, deposits,
      );
    } else {
      const available = Math.min(path.rate, sourceLayer.volume);
      const drained = removeGas(gasLayers, sourceLayer.left, sourceLayer.y, available);
      if (drained <= 0) continue;

      const deposited = distributeToBranches(
        path.branches, drained, gasLayers, blocks, w, h, forkToggle, 0, deposits,
      );
      const leftover = drained - deposited;
      if (leftover > 0) {
        addGas(gasLayers, blocks, sourceLayer.left, sourceLayer.y, leftover, w, h);
      }
    }
  }
}

function teleportPipeRoundRobin(
  path: GasPath,
  validBranches: PathBranch[],
  sourceLayer: GasLayer,
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  pipeRoundRobin: Map<number, PipeRoundRobin>,
  deposits?: { x: number; y: number }[],
): void {
  const netId = path.networkId!;

  const exitKeys = validBranches
    .map(b => b.destination ? `${b.destination.x},${b.destination.y}` : '')
    .filter(k => k !== '');

  let rr = pipeRoundRobin.get(netId);
  if (!rr || !arraysEqual(rr.exitKeys, exitKeys)) {
    rr = { index: 0, exitKeys };
    pipeRoundRobin.set(netId, rr);
  }

  for (let attempt = 0; attempt < validBranches.length; attempt++) {
    const idx = rr.index % validBranches.length;
    const branch = validBranches[idx];

    if (canBranchAccept(branch, gasLayers)) {
      const available = Math.min(path.rate, sourceLayer.volume);
      const drained = removeGas(gasLayers, sourceLayer.left, sourceLayer.y, available);
      if (drained > 0) {
        const dest = branch.destination!;
        const deposited = addGas(gasLayers, blocks, dest.x, dest.y, drained, w, h);
        if (deposited > 0 && deposits) deposits.push({ x: dest.x, y: dest.y });
        const leftover = drained - deposited;
        if (leftover > 0) {
          addGas(gasLayers, blocks, sourceLayer.left, sourceLayer.y, leftover, w, h);
        }
      }
      rr.index = (idx + 1) % validBranches.length;
      return;
    }

    rr.index = (idx + 1) % validBranches.length;
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function distributeToBranches(
  branches: PathBranch[],
  volume: number,
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  forkToggle: boolean,
  cascadeDepth: number,
  deposits?: { x: number; y: number }[],
): number {
  if (volume <= 0 || cascadeDepth > MAX_CASCADE) return 0;

  const valid = branches.filter(b => b.destination !== null);
  if (valid.length === 0) return 0;

  if (valid.length === 1) {
    const dest = valid[0].destination!;
    const added = addGas(gasLayers, blocks, dest.x, dest.y, volume, w, h);
    if (added > 0 && deposits) deposits.push({ x: dest.x, y: dest.y });
    return added;
  }

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
      const added = addGas(gasLayers, blocks, dest.x, dest.y, branchVol, w, h);
      if (added > 0 && deposits) deposits.push({ x: dest.x, y: dest.y });
      totalDeposited += added;
    }
  }

  return totalDeposited;
}
