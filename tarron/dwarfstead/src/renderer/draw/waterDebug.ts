/**
 * Water debug overlay — shows fill ratio per water layer row.
 * Always drawn in WaterTestScene.
 *
 * One text label per water layer: "vol/cap" (e.g. "10/20") at layer center.
 */

import Phaser from 'phaser';
import type { WaterSimState } from '../../sim/water/types';
import { VOLUME_PER_TILE } from '../../sim/water/waterLayer';

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '10px', fontFamily: 'monospace', color: '#00ff00',
  backgroundColor: '#000000AA', padding: { x: 1, y: 0 },
};

/**
 * Draw water layer fill labels. Destroys old labels and returns new ones.
 */
export function drawWaterDebug(
  scene: Phaser.Scene,
  oldLabels: Phaser.GameObjects.Text[],
  state: WaterSimState,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): Phaser.GameObjects.Text[] {
  for (const l of oldLabels) l.destroy();
  const labels: Phaser.GameObjects.Text[] = [];

  for (const layer of state.waterLayers) {
    if (layer.volume <= 0) continue;

    const vy = layer.y - camY;
    if (vy < -1 || vy > tilesY) continue;

    const width = layer.right - layer.left + 1;
    const cap = width * VOLUME_PER_TILE;
    const centerX = Math.floor((layer.left + layer.right) / 2);
    const cvx = centerX - camX;
    if (cvx < 0 || cvx >= tilesX) continue;

    const px = cvx * ts + ts / 2;
    const py = vy * ts + ts / 2;

    const label = scene.add.text(px, py, `${layer.volume}/${cap}`, LABEL_STYLE)
      .setOrigin(0.5).setDepth(51);
    labels.push(label);
  }

  return labels;
}
