import Phaser from 'phaser';
import { type GradientDir, drawTileGradient, CAVE_COLOR } from './background';

export interface TileVariant {
  name: string;
  label: string;
  dir: GradientDir;
  skyFrac0: number;
  skyFrac1: number;
  caveFrac0: number;
  caveFrac1: number;
}

export const TILE_VARIANTS: TileVariant[] = [
  { name: 'cliff-left', label: 'Cliff Left (sky left, cave right)',
    dir: 'left-right', skyFrac0: 0.2, skyFrac1: 0.2, caveFrac0: 0.8, caveFrac1: 0.8 },
  { name: 'cliff-right', label: 'Cliff Right (sky right, cave left)',
    dir: 'right-left', skyFrac0: 0.8, skyFrac1: 0.8, caveFrac0: 0.2, caveFrac1: 0.2 },
  { name: 'corner-top-left', label: 'Corner Top-Left (sky top-left)',
    dir: 'left-top', skyFrac0: 0.2, skyFrac1: 0.2, caveFrac0: 0.8, caveFrac1: 0.8 },
  { name: 'corner-top-right', label: 'Corner Top-Right (sky top-right)',
    dir: 'right-top', skyFrac0: 0.2, skyFrac1: 0.8, caveFrac0: 0.8, caveFrac1: 0.2 },
  { name: 'corner-bottom-left', label: 'Corner Bottom-Left (sky dominant, cave bottom-left)',
    dir: 'inv-left-bottom', skyFrac0: 0.2, skyFrac1: 0.8, caveFrac0: 0.8, caveFrac1: 0.2 },
  { name: 'corner-bottom-right', label: 'Corner Bottom-Right (sky dominant, cave bottom-right)',
    dir: 'inv-right-bottom', skyFrac0: 0.2, skyFrac1: 0.2, caveFrac0: 0.8, caveFrac1: 0.8 },
  { name: 'band-sky-top', label: 'Band (sky top, cave bottom)',
    dir: 'top-bottom', skyFrac0: 0.2, skyFrac1: 0.2, caveFrac0: 0.8, caveFrac1: 0.8 },
  { name: 'band-sky-bottom', label: 'Band (sky bottom, cave top)',
    dir: 'bottom-top', skyFrac0: 0.8, skyFrac1: 0.8, caveFrac0: 0.2, caveFrac1: 0.2 },
];

const TEXTURE_PREFIX = 'grad-tile:';

/**
 * Convert fractional edge positions to absolute pixel positions.
 * For axis-aligned dirs (top-bottom, left-right, right-left) both edges share the same axis.
 * For corner dirs (left-top, left-bottom, right-top, right-bottom) pos0 is on the
 * first named edge and pos1 is on the second.
 */
export function variantPositions(
  v: TileVariant, px: number, py: number, ts: number,
): { skyPos0: number; skyPos1: number; cavePos0: number; cavePos1: number } {
  let base0: number, base1: number;
  switch (v.dir) {
    case 'left-right': case 'right-left': base0 = px; base1 = px; break;
    case 'top-bottom': case 'bottom-top': base0 = py; base1 = py; break;
    // Corner dirs: first edge is vertical (py-based), second is horizontal (px-based)
    case 'left-top': case 'left-bottom': case 'right-top': case 'right-bottom':
    case 'inv-left-bottom': case 'inv-right-bottom':
      base0 = py; base1 = px; break;
  }
  return {
    skyPos0: base0 + v.skyFrac0 * ts,
    skyPos1: base1 + v.skyFrac1 * ts,
    cavePos0: base0 + v.caveFrac0 * ts,
    cavePos1: base1 + v.caveFrac1 * ts,
  };
}

function textureKey(name: string, ts: number): string {
  return `${TEXTURE_PREFIX}${name}:${ts}`;
}

/** Pre-render all gradient tile variants as Phaser textures. */
export function generateGradientTextures(scene: Phaser.Scene, ts: number): void {
  const gfx = scene.add.graphics();
  for (const v of TILE_VARIANTS) {
    const key = textureKey(v.name, ts);
    if (scene.textures.exists(key)) continue;
    gfx.clear();
    gfx.fillStyle(CAVE_COLOR, 1);
    gfx.fillRect(0, 0, ts, ts);
    const pos = variantPositions(v, 0, 0, ts);
    drawTileGradient(gfx, 0, 0, ts, v.dir, pos.skyPos0, pos.skyPos1, pos.cavePos0, pos.cavePos1);
    gfx.generateTexture(key, ts, ts);
  }
  gfx.destroy();
}

/** Remove all pre-rendered gradient textures (for zoom change cleanup). */
export function destroyGradientTextures(scene: Phaser.Scene): void {
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith(TEXTURE_PREFIX)) scene.textures.remove(key);
  }
}

/** Convenience: destroy then regenerate at new tile size. */
export function refreshGradientTextures(scene: Phaser.Scene, ts: number): void {
  destroyGradientTextures(scene);
  generateGradientTextures(scene, ts);
}
