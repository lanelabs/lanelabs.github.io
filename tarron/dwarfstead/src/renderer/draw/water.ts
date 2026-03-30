/**
 * Water rendering — draws settled pools, path traces, and pipe fill.
 *
 * Visual language:
 * - Settled pool water: solid blue blocks (0x2266cc, alpha 0.75)
 * - Water paths: lighter blue (0x55bbff, alpha 0.45) showing traced routes
 *   Inside pipes the fill is clipped to the pipe interior.
 * - Pipes: copper frame (0xb87333) with blue fill proportional to pipeFill
 *   Open terminals (air side) have no wall cap; capped terminals (solid) do.
 */

import Phaser from 'phaser';
import type { WaterSimState } from '../../sim/water/types';
import { BlockMaterial, Direction } from '../../sim/types';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';
import { layerFillFraction, findLayer } from '../../sim/water/waterLayer';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';
import { drawPipeTerminals } from './pipeTerminals';
import { computeChipFills, drawChipTriangle, chipAlpha } from './chipFill';
import { CAVE_COLOR } from './background';

const WATER_COLOR = 0x2266cc;
const FLOW_COLOR = 0x55bbff;
const PIPE_COLOR = 0xb87333;

export function drawWater(
  g: Phaser.GameObjects.Graphics,
  state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
  blocks?: BlockMaterial[][],
): void {
  g.clear();
  drawPaths(g, state, ts, camX, camY);
  drawPoolWater(g, state, ts, tilesX, tilesY, camX, camY);
  if (blocks) drawChipFills(g, state, blocks, ts, tilesX, tilesY, camX, camY);
  drawPipes(g, state, ts, tilesX, tilesY, camX, camY, blocks);
}

function drawPoolWater(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  for (const layer of state.waterLayers) {
    if (layer.volume <= 0) continue;
    const frac = layerFillFraction(layer);
    const fillH = Math.ceil(ts * frac);

    for (let x = layer.left; x <= layer.right; x++) {
      const vx = x - camX;
      const vy = layer.y - camY;
      if (vx < 0 || vx >= tilesX || vy < 0 || vy >= tilesY) continue;
      const px = vx * ts;
      const py = vy * ts;

      const aboveLayer = findLayer(state.waterLayers, x, layer.y - 1);
      const aboveHasWater = aboveLayer !== null && aboveLayer.volume > 0;

      if (aboveHasWater) {
        g.fillStyle(WATER_COLOR, 1);
        g.fillRect(px, py, ts, ts);
      } else {
        const fillY = py + ts - fillH;
        g.fillStyle(WATER_COLOR, 1);
        g.fillRect(px, fillY, ts, fillH);
        if (frac < 1) {
          g.lineStyle(1, 0x88bbff, 0.5);
          g.beginPath();
          g.moveTo(px, fillY);
          for (let wx = 1; wx <= ts; wx += 2) {
            g.lineTo(px + wx, fillY + Math.sin(wx * 0.3) * 1.5);
          }
          g.strokePath();
        }
      }
    }
  }
}

function isSolid(blocks: BlockMaterial[][], wx: number, wy: number): boolean {
  if (wy < 0 || wy >= blocks.length) return true;
  if (wx < 0 || wx >= blocks[0].length) return true;
  return blocks[wy][wx] !== BlockMaterial.Air;
}

function blockColor(blocks: BlockMaterial[][], wx: number, wy: number): number {
  if (wx < 0 || wx >= blocks[0].length || wy < 0 || wy >= blocks.length) return 0x2c2c2c;
  return parseInt(BLOCK_INFO[blocks[wy][wx]].color.slice(1), 16);
}

function drawChipFills(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  blocks: BlockMaterial[][],
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  const chip = Math.ceil(ts * 0.2);
  const corners: ('tl' | 'tr' | 'bl' | 'br')[] = ['tl', 'tr', 'bl', 'br'];

  for (let vy = 0; vy < tilesY; vy++) {
    for (let vx = 0; vx < tilesX; vx++) {
      const wx = camX + vx;
      const wy = camY + vy;
      if (wx < 0 || wx >= blocks[0].length || wy < 0 || wy >= blocks.length) continue;
      const px = vx * ts;
      const py = vy * ts;

      if (blocks[wy][wx] !== BlockMaterial.Air) {
        const chipTL = !isSolid(blocks, wx, wy - 1) && !isSolid(blocks, wx - 1, wy);
        const chipTR = !isSolid(blocks, wx, wy - 1) && !isSolid(blocks, wx + 1, wy);
        const chipBL = !isSolid(blocks, wx, wy + 1) && !isSolid(blocks, wx - 1, wy);
        const chipBR = !isSolid(blocks, wx, wy + 1) && !isSolid(blocks, wx + 1, wy);
        if (!chipTL && !chipTR && !chipBL && !chipBR) continue;
        const fills = computeChipFills(wx, wy, chipTL, chipTR, chipBL, chipBR, state.waterLayers);
        for (const c of corners) {
          if (fills[c] !== null) drawChipTriangle(g, px, py, ts, chip, c, fills[c]!, chipAlpha(fills[c]!));
        }
      } else {
        if (isSolid(blocks, wx - 1, wy) && isSolid(blocks, wx, wy - 1))
          drawChipTriangle(g, px, py, ts, chip, 'tl', blockColor(blocks, wx - 1, wy), 1);
        if (isSolid(blocks, wx + 1, wy) && isSolid(blocks, wx, wy - 1))
          drawChipTriangle(g, px, py, ts, chip, 'tr', blockColor(blocks, wx + 1, wy), 1);
        if (isSolid(blocks, wx - 1, wy) && isSolid(blocks, wx, wy + 1))
          drawChipTriangle(g, px, py, ts, chip, 'bl', blockColor(blocks, wx - 1, wy), 1);
        if (isSolid(blocks, wx + 1, wy) && isSolid(blocks, wx, wy + 1))
          drawChipTriangle(g, px, py, ts, chip, 'br', blockColor(blocks, wx + 1, wy), 1);
      }
    }
  }
}

/** Draw non-pipe path nodes as full-tile flow overlay, deduplicated. */
function drawPaths(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  ts: number, camX: number, camY: number,
): void {
  const drawn = new Set<string>();
  for (const path of state.paths) {
    for (const branch of path.branches) {
      for (const node of branch.nodes) {
        if (node.inPipe) continue;
        const key = `${node.x},${node.y}`;
        if (drawn.has(key)) continue;
        drawn.add(key);
        const px = (node.x - camX) * ts;
        const py = (node.y - camY) * ts;
        g.fillStyle(FLOW_COLOR, 0.45);
        g.fillRect(px, py, ts, ts);
      }
    }
  }
}

/** Fill the interior of a pipe tile based on neighbor connectivity. */
function drawPipeInterior(
  g: Phaser.GameObjects.Graphics,
  pipes: WaterSimState['pipes'],
  wx: number, wy: number,
  px: number, py: number, ts: number,
  pw: number, ph: number,
  pipeW: number, wallT: number, inner: number,
  color: number, alpha: number,
): void {
  const neighbors = pipeNeighborDirs(pipes, wx, wy, pw, ph);
  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const half = pipeW / 2;

  const hasUp = neighbors.includes(Direction.Up);
  const hasDown = neighbors.includes(Direction.Down);
  const hasLeft = neighbors.includes(Direction.Left);
  const hasRight = neighbors.includes(Direction.Right);

  g.fillStyle(color, alpha);

  // Center box (extends to edge on open/neighbor sides)
  const il = cx - half + (hasLeft ? 0 : wallT);
  const ir = cx + half - (hasRight ? 0 : wallT);
  const it = cy - half + (hasUp ? 0 : wallT);
  const ib = cy + half - (hasDown ? 0 : wallT);
  g.fillRect(il, it, ir - il, ib - it);

  for (const dir of neighbors) {
    fillArmToward(g, dir, px, py, ts, cx, cy, half, wallT, inner);
  }
}

function fillArmToward(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number, inner: number,
): void {
  switch (dir) {
    case Direction.Left:  g.fillRect(px, cy - half + wallT, cx - half - px, inner); break;
    case Direction.Right: g.fillRect(cx + half, cy - half + wallT, px + ts - cx - half, inner); break;
    case Direction.Up:    g.fillRect(cx - half + wallT, py, inner, cy - half - py); break;
    case Direction.Down:  g.fillRect(cx - half + wallT, cy + half, inner, py + ts - cy - half); break;
  }
}

function drawPipes(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
  blocks?: BlockMaterial[][],
): void {
  const pipeW = Math.max(4, Math.round(ts * 0.4));
  const wallT = Math.max(1, Math.round(ts * 0.08));
  const ph = state.pipes.length;
  const pw = ph > 0 ? state.pipes[0].length : 0;

  for (let vy = 0; vy < tilesY; vy++) {
    for (let vx = 0; vx < tilesX; vx++) {
      const wx = camX + vx;
      const wy = camY + vy;
      if (wx < 0 || wy < 0 || wy >= ph || wx >= pw) continue;
      if (!state.pipes[wy][wx]) continue;

      const px = vx * ts;
      const py = vy * ts;
      const cx = px + ts / 2;
      const cy = py + ts / 2;

      drawPipeInterior(g, state.pipes, wx, wy, px, py, ts, pw, ph, pipeW, wallT, pipeW - wallT * 2, CAVE_COLOR, 1);
      if (state.pipeFill[wy]?.[wx] > 0) {
        drawPipeInterior(g, state.pipes, wx, wy, px, py, ts, pw, ph, pipeW, wallT, pipeW - wallT * 2, FLOW_COLOR, 0.45);
      }
      drawPipeSegment(g, state.pipes, wx, wy, px, py, ts, cx, cy, pipeW, wallT, pw, ph);
      drawPipeTerminals(g, state, blocks, wx, wy, px, py, ts, cx, cy, pipeW, wallT);
    }
  }
}

/** Draw pipe walls based on neighbor connectivity. All non-neighbor sides capped. */
function drawPipeSegment(
  g: Phaser.GameObjects.Graphics,
  pipes: WaterSimState['pipes'],
  wx: number, wy: number,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
  pw: number, ph: number,
): void {
  const neighbors = pipeNeighborDirs(pipes, wx, wy, pw, ph);
  const half = pipeW / 2;
  g.fillStyle(PIPE_COLOR, 0.9);

  for (const dir of neighbors) {
    drawWallsAlongArm(g, dir, px, py, ts, cx, cy, half, wallT);
  }

  const allDirs = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
  for (const dir of allDirs) {
    if (neighbors.includes(dir)) continue;
    drawWallCap(g, dir, cx, cy, half, wallT);
  }

  // Fill inside corners where two adjacent arms meet
  const hasUp = neighbors.includes(Direction.Up);
  const hasDown = neighbors.includes(Direction.Down);
  const hasLeft = neighbors.includes(Direction.Left);
  const hasRight = neighbors.includes(Direction.Right);
  if (hasUp && hasLeft)    g.fillRect(cx - half, cy - half, wallT, wallT);
  if (hasUp && hasRight)   g.fillRect(cx + half - wallT, cy - half, wallT, wallT);
  if (hasDown && hasLeft)  g.fillRect(cx - half, cy + half - wallT, wallT, wallT);
  if (hasDown && hasRight) g.fillRect(cx + half - wallT, cy + half - wallT, wallT, wallT);
}

function drawWallsAlongArm(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number,
): void {
  switch (dir) {
    case Direction.Left:
      g.fillRect(px, cy - half, cx - half - px, wallT);
      g.fillRect(px, cy + half - wallT, cx - half - px, wallT);
      break;
    case Direction.Right:
      g.fillRect(cx + half, cy - half, px + ts - cx - half, wallT);
      g.fillRect(cx + half, cy + half - wallT, px + ts - cx - half, wallT);
      break;
    case Direction.Up:
      g.fillRect(cx - half, py, wallT, cy - half - py);
      g.fillRect(cx + half - wallT, py, wallT, cy - half - py);
      break;
    case Direction.Down:
      g.fillRect(cx - half, cy + half, wallT, py + ts - cy - half);
      g.fillRect(cx + half - wallT, cy + half, wallT, py + ts - cy - half);
      break;
  }
}

function drawWallCap(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  cx: number, cy: number, half: number, wallT: number,
): void {
  switch (dir) {
    case Direction.Left:  g.fillRect(cx - half, cy - half, wallT, half * 2); break;
    case Direction.Right: g.fillRect(cx + half - wallT, cy - half, wallT, half * 2); break;
    case Direction.Up:    g.fillRect(cx - half, cy - half, half * 2, wallT); break;
    case Direction.Down:  g.fillRect(cx - half, cy + half - wallT, half * 2, wallT); break;
  }
}
