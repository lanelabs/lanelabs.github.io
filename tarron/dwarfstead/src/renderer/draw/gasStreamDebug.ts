/**
 * Gas stream debug tiles — renders sample tiles for each gas stream shape variant.
 * Mirror of drawStreamDebugTiles from streamShapes.ts with gas-inverted directions.
 */

import Phaser from 'phaser';
import { Direction } from '../../sim/types';
import type { GasClassifiedNode } from './gasStreamContext';
import { drawGasStreamNode } from './gasStreamShapes';

export function drawGasDebugTiles(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  labels: Phaser.GameObjects.Text[],
  ts: number,
): Phaser.GameObjects.Text[] {
  for (const lbl of labels) lbl.destroy();
  const newLabels: Phaser.GameObjects.Text[] = [];

  const samples: { label: string; node: GasClassifiedNode }[] = [
    { label: 'horiz ribbon\n(also cliff dual)', node: { x: 0, y: 0, cls: 'horizontal', prevDir: Direction.Right, nextDir: Direction.Right } },
    { label: 'vert column\n(also source up)', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Up, nextDir: Direction.Up } },
    { label: 'rise after\nturn from R', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Up, nextDir: Direction.Up, chipDir: 'left' } },
    { label: 'rise after\nturn from L', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Up, nextDir: Direction.Up, chipDir: 'right' } },
    { label: 'rise after\nT-junction', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Up, nextDir: Direction.Up, chipDir: 'both' } },
    { label: 'corner:\nfromL goUp', node: { x: 0, y: 0, cls: 'corner', prevDir: Direction.Right, nextDir: Direction.Up } },
    { label: 'corner:\nfromR goUp', node: { x: 0, y: 0, cls: 'corner', prevDir: Direction.Left, nextDir: Direction.Up } },
    { label: 'corner:\nfromBot goR', node: { x: 0, y: 0, cls: 'corner', prevDir: Direction.Up, nextDir: Direction.Right } },
    { label: 'corner:\nfromBot goL', node: { x: 0, y: 0, cls: 'corner', prevDir: Direction.Up, nextDir: Direction.Left } },
    { label: 'land: rise\nhits ceil R', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Right } },
    { label: 'land: rise\nhits ceil L', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Left } },
    { label: 'land: T-fork\nhits ceil', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Right, dual: true } },
    { label: 'land below\ncliff, go R', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Right, innerCurve: 'left' } },
    { label: 'land below\ncliff, go L', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Left, innerCurve: 'right' } },
    { label: 'land below\ncliff, T-fork', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Up, nextDir: Direction.Right, dual: true, innerCurve: 'both' } },
    { label: 'rise enters\npool', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Up, nextDir: null } },
    { label: 'pool below\ncliff on L', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Up, nextDir: null, innerCurve: 'left' } },
    { label: 'pool below\ncliff on R', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Up, nextDir: null, innerCurve: 'right' } },
    { label: 'pool below\ncliff both', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Up, nextDir: null, innerCurve: 'both' } },
    { label: 'pipe exit\nrises up', node: { x: 0, y: 0, cls: 'source', prevDir: null, nextDir: Direction.Up, pipeExit: true } },
    { label: 'pipe exit\ninto pool', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Up, nextDir: null, pipeExit: true } },
  ];

  const cols = 5;
  const pad = 12;
  const cellW = Math.max(ts + pad * 2, 100);
  const cellH = ts + pad * 2 + 28;
  const startX = 10;
  const startY = 70;

  g.fillStyle(0x111122, 0.9);
  const rows = Math.ceil(samples.length / cols);
  g.fillRect(startX - 4, startY - 4, cols * cellW + 8, rows * cellH + 8);

  const style = { fontSize: '8px', fontFamily: 'monospace', color: '#ffcc44' };

  for (let i = 0; i < samples.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = startX + col * cellW + Math.round((cellW - ts) / 2);
    const py = startY + row * cellH + pad;

    g.fillStyle(0x252535, 1);
    g.fillRect(px, py, ts, ts);

    drawGasStreamNode(g, samples[i].node, px, py, ts);

    const cellCx = startX + col * cellW + cellW / 2;
    const lbl = scene.add.text(cellCx, py + ts + 2, `${i} ${samples[i].label}`, style)
      .setOrigin(0.5, 0).setDepth(200);
    newLabels.push(lbl);
  }

  return newLabels;
}
