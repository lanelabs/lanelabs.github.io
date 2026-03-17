import Phaser from 'phaser';
import { TilePreview } from './TilePreview';

const OVERLAY_DEPTH = 300;

export class AdminOverlay {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private tilePreview: TilePreview;
  private tilePreviewBtn!: Phaser.GameObjects.Text;
  private visible = false;

  constructor(
    private scene: Phaser.Scene,
    private onBack: () => void,
  ) {
    const { width, height } = scene.scale;

    this.container = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH).setVisible(false);

    this.bg = scene.add.graphics();
    this.drawBg(width, height);
    this.container.add(this.bg);

    // Title
    const title = scene.add.text(width / 2, height / 2 - 60, 'ADMIN', {
      fontSize: '32px', fontFamily: 'serif', color: '#e8c170',
    }).setOrigin(0.5);
    this.container.add(title);

    // Tile Preview toggle
    this.tilePreview = new TilePreview(scene);

    this.tilePreviewBtn = scene.add.text(width / 2, height / 2, this.tilePreviewLabel(), {
      fontSize: '18px', color: '#a0a0b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tilePreviewBtn.on('pointerover', () => this.tilePreviewBtn.setColor('#ffffff'));
    this.tilePreviewBtn.on('pointerout', () => this.tilePreviewBtn.setColor('#a0a0b8'));
    this.tilePreviewBtn.on('pointerdown', () => {
      this.tilePreview.toggle();
      this.tilePreviewBtn.setText(this.tilePreviewLabel());
    });
    this.container.add(this.tilePreviewBtn);

    // Back button
    const backBtn = scene.add.text(width / 2, height / 2 + 40, '[ Back ]', {
      fontSize: '18px', color: '#a0a0b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#a0a0b8'));
    backBtn.on('pointerdown', () => this.onBack());
    this.container.add(backBtn);
  }

  private tilePreviewLabel(): string {
    return `[ Tile Preview: ${this.tilePreview.isVisible() ? 'ON' : 'OFF'} ]`;
  }

  private drawBg(w: number, h: number): void {
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.7);
    this.bg.fillRect(0, 0, w, h);
  }

  show(): void {
    this.visible = true;
    this.tilePreviewBtn.setText(this.tilePreviewLabel());
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }

  reposition(w: number, h: number): void {
    this.drawBg(w, h);
    const children = this.container.getAll();
    // index 0 = bg, 1 = title, 2 = tile preview btn, 3 = back btn
    if (children[1]) (children[1] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2 - 60);
    if (children[2]) (children[2] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2);
    if (children[3]) (children[3] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2 + 40);
    this.tilePreview.reposition(w, h);
  }
}
