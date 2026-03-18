import Phaser from 'phaser';

const SESSION_KEY = 'dwarfstead-grid-overlay';
const DEPTH = 95;
const FONT_SIZE = 10;
const STRIP_HEIGHT = 16;
const STRIP_WIDTH = 20;
const POOL_SIZE = 120;

function getSessionVisible(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
function setSessionVisible(v: boolean): void {
  if (v) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: `${FONT_SIZE}px`,
  fontFamily: 'monospace',
  color: '#c0c0d0',
};

export class GridOverlay {
  private container: Phaser.GameObjects.Container;
  private topStrip: Phaser.GameObjects.Graphics;
  private leftStrip: Phaser.GameObjects.Graphics;
  private colLabels: Phaser.GameObjects.Text[] = [];
  private rowLabels: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
      .setDepth(DEPTH)
      .setVisible(getSessionVisible());

    this.topStrip = scene.add.graphics();
    this.leftStrip = scene.add.graphics();
    this.container.add([this.topStrip, this.leftStrip]);

    for (let i = 0; i < POOL_SIZE; i++) {
      const col = scene.add.text(0, 0, '', LABEL_STYLE)
        .setOrigin(0.5, 0).setAlpha(0.7).setVisible(false);
      this.colLabels.push(col);
      this.container.add(col);

      const row = scene.add.text(0, 0, '', LABEL_STYLE)
        .setOrigin(0, 0.5).setAlpha(0.7).setVisible(false);
      this.rowLabels.push(row);
      this.container.add(row);
    }
  }

  update(camX: number, camY: number, tileSize: number, tilesX: number, tilesY: number): void {
    if (!this.container.visible) return;

    const { width } = this.scene.scale;

    // Draw top strip background
    this.topStrip.clear();
    this.topStrip.fillStyle(0x1a1a2e, 0.8);
    this.topStrip.fillRect(0, 0, width, STRIP_HEIGHT);

    // Draw left strip background
    this.leftStrip.clear();
    this.leftStrip.fillStyle(0x1a1a2e, 0.8);
    this.leftStrip.fillRect(0, STRIP_HEIGHT, STRIP_WIDTH, this.scene.scale.height - STRIP_HEIGHT);

    // Column labels (top)
    for (let i = 0; i < POOL_SIZE; i++) {
      if (i < tilesX + 1) {
        const worldX = camX + i;
        const screenX = (i * tileSize) + tileSize / 2;
        this.colLabels[i].setText(String(worldX));
        this.colLabels[i].setPosition(screenX, 2);
        this.colLabels[i].setVisible(true);
      } else {
        this.colLabels[i].setVisible(false);
      }
    }

    // Row labels (left)
    for (let i = 0; i < POOL_SIZE; i++) {
      if (i < tilesY + 1) {
        const worldY = camY + i;
        const screenY = (i * tileSize) + tileSize / 2 + STRIP_HEIGHT;
        this.rowLabels[i].setText(String(worldY));
        this.rowLabels[i].setPosition(2, screenY);
        this.rowLabels[i].setVisible(true);
      } else {
        this.rowLabels[i].setVisible(false);
      }
    }
  }

  getTopOffset(): number {
    return this.container.visible ? STRIP_HEIGHT : 0;
  }

  getLeftOffset(): number {
    return this.container.visible ? STRIP_WIDTH : 0;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  toggle(): void {
    const v = !this.container.visible;
    setSessionVisible(v);
    this.container.setVisible(v);
  }

  setVisible(v: boolean): void {
    this.container.setVisible(v);
  }

  restoreSessionVisible(): void {
    this.container.setVisible(getSessionVisible());
  }

  reposition(): void {
    // Strips and labels are repositioned in update()
  }
}
