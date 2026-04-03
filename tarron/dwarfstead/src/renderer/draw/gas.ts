/**
 * Gas rendering — draws settled gas pools, path traces, and pipe fill.
 *
 * Visual language:
 * - Settled gas: solid beige/clay blocks (top-aligned, wave on bottom)
 * - Gas paths: context-aware stream shapes (inverted from water)
 * - Pipes: same copper frame, gas-colored active-arm flow fill
 */

import Phaser from 'phaser';
import type { GasSimState } from '../../sim/gas/types';
import { BlockMaterial, Direction } from '../../sim/types';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';
import { gasLayerFillFraction, findGasLayer } from '../../sim/gas/gasLayer';
import { computeGasChipFills } from './gasChipFill';
import { drawChipTriangle } from './chipFill';
import { buildGasStreamContext } from './gasStreamContext';
import type { GasStreamContext, GasClassifiedNode } from './gasStreamContext';
import { drawGasStreamNode } from './gasStreamShapes';
import { GAS_COLOR } from './gasStreamConstants';

export function drawGas(
  g: Phaser.GameObjects.Graphics,
  state: GasSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
  blocks?: BlockMaterial[][],
): Map<string, Set<Direction>> {
  g.clear();
  const streamCtx = buildGasStreamContext(state);
  drawGasPaths(g, streamCtx, ts, camX, camY);
  drawGasPoolWater(g, state, ts, tilesX, tilesY, camX, camY);
  if (blocks) drawGasChipFills(g, state, blocks, ts, tilesX, tilesY, camX, camY);
  return streamCtx.activePipeArms;
}

/** Draw gas pools — top-aligned fill (gas clings to ceiling). */
function drawGasPoolWater(
  g: Phaser.GameObjects.Graphics, state: GasSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  for (const layer of state.gasLayers) {
    if (layer.volume <= 0) continue;
    const frac = gasLayerFillFraction(layer);
    const fillH = Math.ceil(ts * frac);

    for (let x = layer.left; x <= layer.right; x++) {
      const vx = x - camX;
      const vy = layer.y - camY;
      if (vx < 0 || vx >= tilesX || vy < 0 || vy >= tilesY) continue;
      const px = vx * ts;
      const py = vy * ts;

      // Check if there's gas below (inverted from water checking above)
      const belowLayer = findGasLayer(state.gasLayers, x, layer.y + 1);
      const belowHasGas = belowLayer !== null && belowLayer.volume > 0;

      if (belowHasGas) {
        // Full tile fill when gas continues below
        g.fillStyle(GAS_COLOR, 1);
        g.fillRect(px, py, ts, ts);
      } else {
        // Top-aligned fill (inverted from water's bottom-aligned)
        g.fillStyle(GAS_COLOR, 1);
        g.fillRect(px, py, ts, fillH);
        // Wave texture on bottom edge (inverted from water's top wave)
        if (frac < 1) {
          g.lineStyle(1, 0xd4b892, 0.5);
          g.beginPath();
          const waveY = py + fillH;
          g.moveTo(px, waveY);
          for (let wx = 1; wx <= ts; wx += 2) {
            g.lineTo(px + wx, waveY + Math.sin(wx * 0.3) * 1.5);
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

function drawGasChipFills(
  g: Phaser.GameObjects.Graphics, state: GasSimState,
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
        // Solid tile: outside corners filled with gas color
        const chipTL = !isSolid(blocks, wx, wy - 1) && !isSolid(blocks, wx - 1, wy);
        const chipTR = !isSolid(blocks, wx, wy - 1) && !isSolid(blocks, wx + 1, wy);
        const chipBL = !isSolid(blocks, wx, wy + 1) && !isSolid(blocks, wx - 1, wy);
        const chipBR = !isSolid(blocks, wx, wy + 1) && !isSolid(blocks, wx + 1, wy);
        if (!chipTL && !chipTR && !chipBL && !chipBR) continue;
        const fills = computeGasChipFills(wx, wy, chipTL, chipTR, chipBL, chipBR, state.gasLayers);
        for (const c of corners) {
          if (fills[c] !== null) drawChipTriangle(g, px, py, ts, chip, c, fills[c]!, 1);
        }
      } else {
        // Air tile: re-draw terrain inside-corner debris on top of gas
        const hasGas = findGasLayer(state.gasLayers, wx, wy) !== null;
        if (!hasGas) continue;
        // Skip pipe tiles — pipe rendering handles their appearance
        if (wy < state.pipes.length && wx < state.pipes[0].length && state.pipes[wy][wx]) continue;
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

function drawGasPaths(
  g: Phaser.GameObjects.Graphics, streamCtx: GasStreamContext,
  ts: number, camX: number, camY: number,
): void {
  const seen = new Map<string, GasClassifiedNode>();
  for (const branch of streamCtx.classifiedBranches) {
    for (const node of branch) {
      const key = `${node.x},${node.y}`;
      const existing = seen.get(key);
      if (existing) {
        if (node.chipDir && node.chipDir !== existing.chipDir) {
          existing.chipDir = 'both';
        } else if (node.chipDir && !existing.chipDir) {
          existing.chipDir = node.chipDir;
        }
        if (node.prevDir !== existing.prevDir || node.nextDir !== existing.nextDir) {
          existing.dual = true;
          // T-junction: one branch horizontal, other purely vertical → corner
          const isH = (d: Direction | null) => d === Direction.Left || d === Direction.Right;
          const eHasH = isH(existing.prevDir) || isH(existing.nextDir);
          const nHasH = isH(node.prevDir) || isH(node.nextDir);
          const eHasUp = existing.prevDir === Direction.Up || existing.nextDir === Direction.Up;
          const nHasUp = node.prevDir === Direction.Up || node.nextDir === Direction.Up;
          const opp = (d: Direction) => d === Direction.Left ? Direction.Right : Direction.Left;
          if (eHasH && !nHasH && nHasUp) {
            const hp = isH(existing.prevDir) ? existing.prevDir! : null;
            const hn = isH(existing.nextDir) ? existing.nextDir! : null;
            existing.cls = 'corner';
            existing.prevDir = Direction.Up;
            existing.nextDir = hp ? opp(hp) : hn!;
          } else if (nHasH && !eHasH && eHasUp) {
            const hp = isH(node.prevDir) ? node.prevDir! : null;
            const hn = isH(node.nextDir) ? node.nextDir! : null;
            existing.cls = 'corner';
            existing.prevDir = Direction.Up;
            existing.nextDir = hp ? opp(hp) : hn!;
          }
        }
        if (node.innerCurve) {
          if (!existing.innerCurve) existing.innerCurve = node.innerCurve;
          else if (node.innerCurve !== existing.innerCurve) existing.innerCurve = 'both';
        }
      } else {
        seen.set(key, { ...node });
      }
    }
  }
  for (const node of seen.values()) {
    const px = (node.x - camX) * ts;
    const py = (node.y - camY) * ts;
    drawGasStreamNode(g, node, px, py, ts);
  }
}

