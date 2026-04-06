/**
 * Builds a flat test world with 7 water lab chambers side by side.
 *
 * Layout: 140 wide × 50 tall. Surface at y=5, stone below.
 * Each chamber has a stone-walled reservoir in the sky zone (y=1-3)
 * that pre-fills with water and drains into the test area.
 *
 * 1. Simple Pool Fill     (~x=3)
 * 2. Overflow             (~x=18)
 * 3. Split                (~x=35)
 * 4. Basic Pipe Flow      (~x=50)
 * 5. Embedded Floor Drain (~x=72)
 * 6. Pipe at Capacity     (~x=95)
 * 7. Pipe-Up              (~x=115)
 */

import { BlockMaterial } from '../types';
import type { TerrainGrid } from './TerrainGenerator';
import type { PipeCell, PumpCell } from '../water/types';
import type { WaterLayer } from '../water/waterLayer';
import { VOLUME_PER_TILE } from '../water/waterLayer';
import type { GasLayer } from '../gas/types';

const W = 140;
const H = 50;
const SURFACE = 5;

function air(b: BlockMaterial[][], x: number, y: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) b[y][x] = BlockMaterial.Air;
}

function stone(b: BlockMaterial[][], x: number, y: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) b[y][x] = BlockMaterial.Stone;
}

function carveRect(b: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) air(b, x + dx, y + dy);
}

function stoneRect(b: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) stone(b, x + dx, y + dy);
}

/** Place a pipe at (x, y). Connectivity is by adjacency. */
function setPipe(pipes: (PipeCell | null)[][], x: number, y: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    pipes[y][x] = true;
  }
}

/**
 * Build a stone-walled reservoir in the sky zone.
 * Returns WaterLayers for every interior row (all filled to capacity).
 * Places a drain pipe at (drainX, floorY) connecting down.
 */
function buildReservoir(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  leftX: number, topY: number,
  innerW: number, innerH: number,
  drainX: number,
): WaterLayer[] {
  const outerLeft = leftX - 1;
  const outerRight = leftX + innerW;
  const ceilingY = topY - 1;
  const floorY = topY + innerH;

  stoneRect(b, outerLeft, ceilingY, innerW + 2, 1);
  stoneRect(b, outerLeft, floorY, innerW + 2, 1);
  for (let y = topY; y < floorY; y++) stone(b, outerLeft, y);
  for (let y = topY; y < floorY; y++) stone(b, outerRight, y);
  carveRect(b, leftX, topY, innerW, innerH);

  // Drain pipe in floor below reservoir
  setPipe(pipes, drainX, floorY);

  const layers: WaterLayer[] = [];
  for (let dy = 0; dy < innerH; dy++) {
    layers.push({ y: topY + dy, left: leftX, right: leftX + innerW - 1, volume: innerW * VOLUME_PER_TILE });
  }
  return layers;
}

/** Build vertical pipe run downward from (x, startY) for length tiles. */
function pipeDown(
  pipes: (PipeCell | null)[][], x: number, startY: number, length: number,
): void {
  for (let i = 0; i < length; i++) {
    setPipe(pipes, x, startY + i);
  }
}

// ── Chamber 1: Simple Pool Fill ──────────────────────────────────
function buildChamber1(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const sx = 6;
  const py = SURFACE + 2;

  const resLayers = buildReservoir(b, pipes, 1, 1, 10, 2, sx);
  layers.push(...resLayers);

  pipeDown(pipes, sx, SURFACE - 1, 1);

  for (let y = SURFACE; y < py; y++) air(b, sx, y);
  carveRect(b, 4, py, 5, 3);
}

// ── Chamber 2: Overflow ──────────────────────────────────────────
function buildChamber2(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const ox = 18;
  const uy = SURFACE + 2;

  const resLayers = buildReservoir(b, pipes, 14, 1, 10, 2, ox + 1);
  layers.push(...resLayers);
  pipeDown(pipes, ox + 1, SURFACE - 1, 1);

  for (let y = SURFACE; y < uy; y++) air(b, ox + 1, y);
  carveRect(b, ox, uy, 3, 3);

  air(b, ox + 3, uy + 2);
  carveRect(b, ox + 3, uy + 2, 3, 1);
  for (let y = uy + 3; y < uy + 6; y++) air(b, ox + 5, y);
  carveRect(b, ox + 3, uy + 6, 4, 3);
}

// ── Chamber 3: Split ─────────────────────────────────────────────
function buildChamber3(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const cx = 38;
  const fy = SURFACE + 2;

  const resLayers = buildReservoir(b, pipes, 33, 1, 10, 2, cx);
  layers.push(...resLayers);
  pipeDown(pipes, cx, SURFACE - 1, 1);

  for (let y = SURFACE; y < fy; y++) air(b, cx, y);
  air(b, cx, fy);
  carveRect(b, cx - 4, fy + 1, 3, 3);
  air(b, cx - 1, fy);
  air(b, cx + 1, fy);
  carveRect(b, cx + 2, fy + 1, 3, 3);
  carveRect(b, cx - 1, fy, 3, 1);
  air(b, cx - 1, fy + 1);
  air(b, cx + 1, fy + 1);
}

// ── Chamber 4: Basic Pipe Flow ───────────────────────────────────
function buildChamber4(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const px = 50;
  const py = SURFACE + 3;

  const resLayers = buildReservoir(b, pipes, 45, 1, 12, 2, px);
  layers.push(...resLayers);
  pipeDown(pipes, px, SURFACE - 1, 1);

  for (let y = SURFACE; y < py; y++) air(b, px, y);

  // Horizontal pipe run: 12 tiles
  const pipeLen = 12;
  for (let dx = 0; dx < pipeLen; dx++) {
    setPipe(pipes, px + dx, py);
  }

  // Pipe exit drop
  const exitX = px + pipeLen - 1;
  for (let y = py + 1; y < py + 5; y++) air(b, exitX, y);
  carveRect(b, exitX - 1, py + 5, 4, 3);
}

// ── Chamber 5: Embedded Floor Drain ──────────────────────────────
function buildChamber5(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const dx = 72;
  const dy = SURFACE + 2;

  const resLayers = buildReservoir(b, pipes, 68, 1, 14, 2, dx + 3);
  layers.push(...resLayers);
  pipeDown(pipes, dx + 3, SURFACE - 1, 1);

  for (let y = SURFACE; y < dy; y++) air(b, dx + 3, y);
  carveRect(b, dx, dy, 7, 3);

  // Pipe tiles in floor row
  const floorY = dy + 3;
  for (let x = dx; x < dx + 7; x++) {
    setPipe(pipes, x, floorY);
  }

  // Downward pipe from last tile
  for (let y = floorY + 1; y < floorY + 4; y++) {
    setPipe(pipes, dx + 6, y);
  }

  // Pipe exit
  const exitY = floorY + 4;
  air(b, dx + 6, exitY);
  carveRect(b, dx + 4, exitY + 1, 5, 3);
}

// ── Chamber 6: Pipe at Capacity + Backup ─────────────────────────
function buildChamber6(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const bx = 95;
  const by = SURFACE + 2;

  const resLayers = buildReservoir(b, pipes, 91, 1, 14, 2, bx + 3);
  layers.push(...resLayers);
  pipeDown(pipes, bx + 3, SURFACE - 1, 1);

  for (let y = SURFACE; y < by; y++) air(b, bx + 3, y);
  carveRect(b, bx + 1, by, 5, 4);

  // Pipe entrance at center of pool floor
  const pipeY = by + 4;
  const pipeX = bx + 3;
  setPipe(pipes, pipeX, pipeY);

  // Downward pipe: 5 tiles
  for (let y = pipeY + 1; y < pipeY + 6; y++) {
    setPipe(pipes, pipeX, y);
  }

  // Pipe exit
  const exitY = pipeY + 6;
  air(b, pipeX, exitY);
  carveRect(b, bx + 1, exitY + 1, 5, 3);
}

// ── Chamber 7: Pipe-Up ───────────────────────────────────────────
function buildChamber7(
  b: BlockMaterial[][], pipes: (PipeCell | null)[][],
  layers: WaterLayer[],
): void {
  const bx = 115;
  const topPool = SURFACE + 2;
  const rightPoolY = SURFACE;

  const resLayers = buildReservoir(b, pipes, 111, 1, 14, 2, bx + 3);
  layers.push(...resLayers);
  pipeDown(pipes, bx + 3, SURFACE - 1, 1);

  for (let y = SURFACE; y < topPool; y++) air(b, bx + 3, y);
  carveRect(b, bx + 1, topPool, 5, 4);

  // Pipe at left pool floor center
  const drainY = topPool + 4;
  const drainX = bx + 3;
  setPipe(pipes, drainX, drainY);

  // Pipe down from drain (3 tiles)
  const pipeBottomY = drainY + 3;
  for (let y = drainY + 1; y <= pipeBottomY; y++) {
    setPipe(pipes, drainX, y);
  }

  // Corner: down → right
  setPipe(pipes, drainX, pipeBottomY + 1);

  // Horizontal pipe right (5 tiles)
  const rightPipeX = drainX + 5;
  for (let x = drainX + 1; x < rightPipeX; x++) {
    setPipe(pipes, x, pipeBottomY + 1);
  }

  // Corner: right → up
  setPipe(pipes, rightPipeX, pipeBottomY + 1);

  // Pipe up to right pool level
  const rightPoolBase = rightPoolY + 3;
  for (let y = pipeBottomY; y >= rightPoolBase; y--) {
    setPipe(pipes, rightPipeX, y);
  }

  // Pipe exit above right pool
  const exitY = rightPoolBase - 1;
  air(b, rightPipeX, exitY);
  carveRect(b, rightPipeX - 1, rightPoolY, 4, 3);
}

export interface WaterTestWorld {
  terrain: TerrainGrid;
  pipes: (PipeCell | null)[][];
  pumps: PumpCell[];
  initialWaterVolume: WaterLayer[];
  initialGasVolume: GasLayer[];
}

// ── Gas Reservoirs (near bottom, y=40-46) ───────────────────────

/** Build simple gas-filled ceiling pockets as reservoirs for manual testing. */
function buildGasReservoirs(
  b: BlockMaterial[][], gasLayers: GasLayer[],
): void {
  // Pocket A: 8-wide, 2-tall at x=5
  const ay = 42;
  carveRect(b, 5, ay, 8, 2);
  gasLayers.push({ y: ay, left: 5, right: 12, volume: 8 * VOLUME_PER_TILE });
  gasLayers.push({ y: ay + 1, left: 5, right: 12, volume: 8 * VOLUME_PER_TILE });

  // Pocket B: 8-wide, 2-tall at x=25
  carveRect(b, 25, ay, 8, 2);
  gasLayers.push({ y: ay, left: 25, right: 32, volume: 8 * VOLUME_PER_TILE });
  gasLayers.push({ y: ay + 1, left: 25, right: 32, volume: 8 * VOLUME_PER_TILE });

  // Pocket C: 8-wide, 2-tall at x=45
  carveRect(b, 45, ay, 8, 2);
  gasLayers.push({ y: ay, left: 45, right: 52, volume: 8 * VOLUME_PER_TILE });
  gasLayers.push({ y: ay + 1, left: 45, right: 52, volume: 8 * VOLUME_PER_TILE });
}

export function buildWaterTestTerrain(): WaterTestWorld {
  const blocks: BlockMaterial[][] = [];
  for (let y = 0; y < H; y++) {
    const row: BlockMaterial[] = [];
    for (let x = 0; x < W; x++) {
      row.push(y < SURFACE ? BlockMaterial.Air : BlockMaterial.Stone);
    }
    blocks.push(row);
  }

  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < H; y++) pipes.push(new Array(W).fill(null));

  const pumps: PumpCell[] = [];
  const initialWaterVolume: WaterLayer[] = [];
  const initialGasVolume: GasLayer[] = [];

  buildChamber1(blocks, pipes, initialWaterVolume);
  buildChamber2(blocks, pipes, initialWaterVolume);
  buildChamber3(blocks, pipes, initialWaterVolume);
  buildChamber4(blocks, pipes, initialWaterVolume);
  buildChamber5(blocks, pipes, initialWaterVolume);
  buildChamber6(blocks, pipes, initialWaterVolume);
  buildChamber7(blocks, pipes, initialWaterVolume);

  buildGasReservoirs(blocks, initialGasVolume);

  for (let y = 0; y < H; y++) {
    blocks[y][0] = BlockMaterial.Stone;
    blocks[y][W - 1] = BlockMaterial.Stone;
  }
  for (let x = 0; x < W; x++) {
    blocks[H - 1][x] = BlockMaterial.Stone;
  }

  const waterMass: number[][] = [];
  for (let y = 0; y < H; y++) waterMass.push(new Array(W).fill(0));

  const surfaceHeights = new Array(W).fill(SURFACE);
  const strataTint: number[][] = [];
  for (let y = 0; y < H; y++) strataTint.push(new Array(W).fill(0));

  const terrain: TerrainGrid = {
    width: W, height: H, blocks, waterMass,
    strataTint, surfaceY: SURFACE, surfaceHeights, rooms: [],
    initialWaterVolume: [],
    initialGasVolume: [],
  };

  return { terrain, pipes, pumps, initialWaterVolume, initialGasVolume };
}
