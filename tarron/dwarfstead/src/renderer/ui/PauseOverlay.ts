import Phaser from 'phaser';

const OVERLAY_DEPTH = 300;

export class PauseOverlay {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private visible = false;

  constructor(
    private scene: Phaser.Scene,
    private onResume: () => void,
    private onExitToMenu: () => void,
  ) {
    const { width, height } = scene.scale;

    this.container = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH).setVisible(false);

    // Semi-transparent dark overlay
    this.bg = scene.add.graphics();
    this.drawBg(width, height);
    this.container.add(this.bg);

    // "PAUSED" title
    const title = scene.add.text(width / 2, height / 2 - 60, 'PAUSED', {
      fontSize: '32px', fontFamily: 'serif', color: '#e8c170',
    }).setOrigin(0.5);
    this.container.add(title);

    // Resume button
    const resumeBtn = scene.add.text(width / 2, height / 2, '[ Resume ]', {
      fontSize: '18px', color: '#e8c170',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', () => resumeBtn.setColor('#ffffff'));
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#e8c170'));
    resumeBtn.on('pointerdown', () => this.hide());
    this.container.add(resumeBtn);

    // Exit to Menu button
    const exitBtn = scene.add.text(width / 2, height / 2 + 40, '[ Exit to Menu ]', {
      fontSize: '18px', color: '#a0a0b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerover', () => exitBtn.setColor('#ffffff'));
    exitBtn.on('pointerout', () => exitBtn.setColor('#a0a0b8'));
    exitBtn.on('pointerdown', () => this.onExitToMenu());
    this.container.add(exitBtn);
  }

  private drawBg(w: number, h: number): void {
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.7);
    this.bg.fillRect(0, 0, w, h);
  }

  show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
    this.onResume();
  }

  isVisible(): boolean {
    return this.visible;
  }

  reposition(w: number, h: number): void {
    this.drawBg(w, h);
    // Reposition text children (title at index 1, resume at 2, exit at 3)
    const children = this.container.getAll();
    if (children[1]) (children[1] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2 - 60);
    if (children[2]) (children[2] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2);
    if (children[3]) (children[3] as Phaser.GameObjects.Text).setPosition(w / 2, h / 2 + 40);
  }
}
