/**
 * Water rendering — draws settled pools, flowing snake tiles, and pipe fill.
 *
 * Visual language:
 * - Settled pool water: solid blue blocks (0x2266cc, alpha 0.75)
 * - Flowing snakes: solid full-tile fill, lighter shade (0x3399ee, alpha 0.65)
 *   so they blend seamlessly into standing water and leave no gaps.
 *   Inside pipes the fill is clipped to the pipe interior.
 * - Pipes: copper frame (0xb87333) with blue fill proportional to pipeFill
 * - Drain grates: wider copper frame with cross-hatch
 */

import Phaser from 'phaser';
import type { WaterSimState, PipeCell } from '../../sim/water/types';
import { BlockMaterial } from '../../sim/types';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';
import { layerFillFraction, findLayer } from '../../sim/water/waterLayer';
import { drawPipeTerminals } from './pipeTerminals';
import { computeChipFills, drawChipTriangle, chipAlpha } from './chipFill';

const WATER_COLOR = 0x2266cc;
const FLOW_COLOR = 0x55bbff;
const PIPE_COLOR = 0xb87333;
const PIPE_FILL_COLOR = 0x3388dd;

export function drawWater(
  g: Phaser.GameObjects.Graphics,
  state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
  blocks?: BlockMaterial[][],
): void {
  g.clear();
  drawGhosts(g, state, ts, camX, camY);
  drawPoolWater(g, state, ts, tilesX, tilesY, camX, camY);
  if (blocks) drawChipFills(g, state, blocks, ts, tilesX, tilesY, camX, camY);
  drawPipes(g, state, ts, tilesX, tilesY, camX, camY);
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

      // No-gap rule: if there's settled water directly above, render full height
      const aboveLayer = findLayer(state.waterLayers, x, layer.y - 1);
      const aboveHasWater = aboveLayer !== null && aboveLayer.volume > 0;

      if (aboveHasWater) {
        g.fillStyle(WATER_COLOR, 1);
        g.fillRect(px, py, ts, ts);
      } else {
        // Topmost water surface — uniform partial fill with wave
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

/** Get base block color (no strata tint — close enough for small debris triangles). */
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
        // Solid block: fill outside-corner chip cutouts with water
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
        // Air tile: redraw inside-corner debris chips ON TOP of pool water
        // so they aren't hidden by the water rectangle.
        // Uses the same debris logic as terrain.ts:74-85.
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

function drawGhosts(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  ts: number, camX: number, camY: number,
): void {
  const pipeW = Math.max(4, Math.round(ts * 0.4));
  const wallT = Math.max(1, Math.round(ts * 0.08));
  const half = pipeW / 2;
  const inner = pipeW - wallT * 2;

  for (const key of state.ghostTiles) {
    const [xs, ys] = key.split(',');
    const wx = parseInt(xs, 10);
    const wy = parseInt(ys, 10);
    const px = (wx - camX) * ts;
    const py = (wy - camY) * ts;

    const pipe = (wy >= 0 && wy < state.pipes.length && wx >= 0 && wx < state.pipes[0].length)
      ? state.pipes[wy][wx] : null;

    if (!pipe) {
      // Open air: solid full-tile fill
      g.fillStyle(FLOW_COLOR, 0.45);
      g.fillRect(px, py, ts, ts);
    } else {
      // Inside pipe: fill only the interior between walls
      const cx = px + ts / 2;
      const cy = py + ts / 2;
      g.fillStyle(FLOW_COLOR, 0.45);
      if (isHorizontal(pipe)) {
        g.fillRect(px, cy - half + wallT, ts, inner);
      } else if (isVertical(pipe)) {
        g.fillRect(cx - half + wallT, py, inner, ts);
      } else {
        // Elbow: fill both arms
        fillPipeArm(g, pipe.entry, px, py, ts, cx, cy, half, wallT, inner);
        fillPipeArm(g, pipe.exit, px, py, ts, cx, cy, half, wallT, inner);
        // Fill center junction
        g.fillRect(cx - half + wallT, cy - half + wallT, inner, inner);
      }
    }
  }
}

/** Fill one arm of an elbow pipe with flowing water. */
function fillPipeArm(
  g: Phaser.GameObjects.Graphics,
  dir: import('../../sim/types').Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number, inner: number,
): void {
  switch (dir) {
    case 'left':
      g.fillRect(px, cy - half + wallT, cx - px, inner);
      break;
    case 'right':
      g.fillRect(cx, cy - half + wallT, px + ts - cx, inner);
      break;
    case 'up':
      g.fillRect(cx - half + wallT, py, inner, cy - py);
      break;
    case 'down':
      g.fillRect(cx - half + wallT, cy, inner, py + ts - cy);
      break;
  }
}

function drawPipes(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  const pipeW = Math.max(4, Math.round(ts * 0.4));
  const wallT = Math.max(1, Math.round(ts * 0.08));

  for (let vy = 0; vy < tilesY; vy++) {
    for (let vx = 0; vx < tilesX; vx++) {
      const wx = camX + vx;
      const wy = camY + vy;
      if (wx < 0 || wy < 0) continue;
      if (wy >= state.pipes.length || wx >= state.pipes[0].length) continue;

      const pipe = state.pipes[wy][wx];
      if (!pipe) continue;

      const px = vx * ts;
      const py = vy * ts;
      const cx = px + ts / 2;
      const cy = py + ts / 2;

      if (pipe.isDrain) drawDrainGrate(g, px, py, ts, pipeW, wallT);
      drawPipeSegment(g, pipe, px, py, ts, cx, cy, pipeW, wallT);
      drawPipeTerminals(g, state, pipe, wx, wy, px, py, ts, cx, cy, pipeW, wallT);

      const fill = state.pipeFill[wy]?.[wx] ?? 0;
      if (fill > 0) drawPipeFill(g, pipe, px, py, ts, cx, cy, pipeW, wallT, fill);
    }
  }
}

function drawPipeSegment(
  g: Phaser.GameObjects.Graphics, pipe: PipeCell,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
): void {
  const half = pipeW / 2;
  g.fillStyle(PIPE_COLOR, 0.9);

  const isH = isHorizontal(pipe);
  const isV = isVertical(pipe);

  if (isH) {
    g.fillRect(px, cy - half, ts, wallT);
    g.fillRect(px, cy + half - wallT, ts, wallT);
  } else if (isV) {
    g.fillRect(cx - half, py, wallT, ts);
    g.fillRect(cx + half - wallT, py, wallT, ts);
  } else {
    drawPipeHalf(g, pipe.entry, px, py, ts, cx, cy, half, wallT);
    drawPipeHalf(g, pipe.exit, px, py, ts, cx, cy, half, wallT);
  }
}

function drawPipeHalf(
  g: Phaser.GameObjects.Graphics, dir: import('../../sim/types').Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number,
): void {
  g.fillStyle(PIPE_COLOR, 0.9);
  switch (dir) {
    case 'left':
      g.fillRect(px, cy - half, cx - px, wallT);
      g.fillRect(px, cy + half - wallT, cx - px, wallT);
      break;
    case 'right':
      g.fillRect(cx, cy - half, px + ts - cx, wallT);
      g.fillRect(cx, cy + half - wallT, px + ts - cx, wallT);
      break;
    case 'up':
      g.fillRect(cx - half, py, wallT, cy - py);
      g.fillRect(cx + half - wallT, py, wallT, cy - py);
      break;
    case 'down':
      g.fillRect(cx - half, cy, wallT, py + ts - cy);
      g.fillRect(cx + half - wallT, cy, wallT, py + ts - cy);
      break;
  }
}

function drawPipeFill(
  g: Phaser.GameObjects.Graphics, pipe: PipeCell,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
  fill: number,
): void {
  const frac = fill / 4;
  const half = pipeW / 2;
  const inner = pipeW - wallT * 2;
  g.fillStyle(PIPE_FILL_COLOR, 0.7);

  const isH = isHorizontal(pipe);
  const isV = isVertical(pipe);

  if (isH) {
    const fillW = Math.ceil(ts * frac);
    const startX = pipe.entry === 'left' ? px + wallT : px + ts - wallT - fillW;
    g.fillRect(startX, cy - half + wallT, fillW, inner);
  } else if (isV) {
    const fillH = Math.ceil(ts * frac);
    const startY = pipe.entry === 'up' ? py + wallT : py + ts - wallT - fillH;
    g.fillRect(cx - half + wallT, startY, inner, fillH);
  } else {
    g.fillStyle(PIPE_FILL_COLOR, 0.6 * frac);
    g.fillRect(cx - half + wallT, cy - half + wallT, inner, inner);
  }
}

function drawDrainGrate(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  pipeW: number, _wallT: number,
): void {
  const grateW = Math.round(pipeW * 1.4);
  const gx = px + (ts - grateW) / 2;
  const gy = py;
  const gh = Math.max(3, Math.round(ts * 0.15));

  g.fillStyle(PIPE_COLOR, 1);
  g.fillRect(gx, gy, grateW, gh);

  g.lineStyle(1, 0x8B5E3C, 0.6);
  const bars = Math.max(2, Math.floor(grateW / 4));
  for (let i = 1; i < bars; i++) {
    const bx = gx + (grateW / bars) * i;
    g.beginPath();
    g.moveTo(bx, gy);
    g.lineTo(bx, gy + gh);
    g.strokePath();
  }
}

function isHorizontal(pipe: PipeCell): boolean {
  return (pipe.entry === 'left' || pipe.entry === 'right') &&
         (pipe.exit === 'left' || pipe.exit === 'right');
}

function isVertical(pipe: PipeCell): boolean {
  return (pipe.entry === 'up' || pipe.entry === 'down') &&
         (pipe.exit === 'up' || pipe.exit === 'down');
}
