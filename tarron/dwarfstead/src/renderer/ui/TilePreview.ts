import Phaser from 'phaser';
import { drawTileGradient, CAVE_COLOR } from '../draw/background';
import { TILE_VARIANTS, variantPositions } from '../draw/gradientTiles';

const TILE_SIZE = 300;
const PREVIEW_DEPTH = 250;

const SESSION_KEY = 'dwarfstead-tile-preview';
const VARIANT_KEY = 'dwarfstead-tile-variant';

function getSessionVisible(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
function setSessionVisible(v: boolean): void {
  if (v) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

export class TilePreview {
  private container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private variantIndex: number;

  constructor(private scene: Phaser.Scene) {
    const saved = Number(sessionStorage.getItem(VARIANT_KEY) ?? 0);
    this.variantIndex = saved >= 0 && saved < TILE_VARIANTS.length ? saved : 0;

    const { width, height } = scene.scale;
    this.container = scene.add.container(0, 0).setDepth(PREVIEW_DEPTH).setVisible(getSessionVisible());

    const rx = width - TILE_SIZE / 2 - 10;
    const ry = height / 2;
    this.label = scene.add.text(rx, ry - TILE_SIZE / 2 - 20, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8c170',
    }).setOrigin(0.5, 1);
    this.container.add(this.label);

    this.gfx = scene.add.graphics();
    this.container.add(this.gfx);

    // Click on preview tile to cycle variant
    const hitZone = scene.add.zone(rx, ry, TILE_SIZE, TILE_SIZE)
      .setDepth(PREVIEW_DEPTH + 1).setInteractive({ useHandCursor: true });
    this.container.add(hitZone);
    hitZone.on('pointerdown', () => this.nextVariant());

    this.draw(width, height);
  }

  private nextVariant(): void {
    this.variantIndex = (this.variantIndex + 1) % TILE_VARIANTS.length;
    sessionStorage.setItem(VARIANT_KEY, String(this.variantIndex));
    const { width, height } = this.scene.scale;
    this.draw(width, height);
  }

  private draw(w: number, h: number): void {
    this.gfx.clear();
    const px = Math.round(w - TILE_SIZE - 10);
    const py = Math.round(h / 2 - TILE_SIZE / 2);

    const v = TILE_VARIANTS[this.variantIndex];
    this.label.setText(`${v.label}  [${this.variantIndex + 1}/${TILE_VARIANTS.length}]`);

    // Cave background for the tile
    this.gfx.fillStyle(CAVE_COLOR, 1);
    this.gfx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Draw variant gradient
    const pos = variantPositions(v, px, py, TILE_SIZE);
    drawTileGradient(this.gfx, px, py, TILE_SIZE, v.dir, pos.skyPos0, pos.skyPos1, pos.cavePos0, pos.cavePos1);

    // Border
    this.gfx.lineStyle(1, 0x888898, 0.6);
    this.gfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
  }

  show(): void { this.container.setVisible(true); }
  hide(): void { this.container.setVisible(false); }
  isVisible(): boolean { return this.container.visible; }

  toggle(): void {
    const v = !this.container.visible;
    setSessionVisible(v);
    this.container.setVisible(v);
  }

  reposition(w: number, h: number): void {
    this.label.setPosition(w - TILE_SIZE / 2 - 10, h / 2 - TILE_SIZE / 2 - 20);
    this.draw(w, h);
  }
}
