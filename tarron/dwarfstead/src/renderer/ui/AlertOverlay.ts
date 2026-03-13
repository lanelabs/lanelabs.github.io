import Phaser from 'phaser';

const FADE_DURATION = 2500;

export class AlertOverlay {
  private text: Phaser.GameObjects.Text;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(private scene: Phaser.Scene, screenW: number) {
    this.text = scene.add.text(
      Math.floor(screenW / 2), 80,
      '', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ff6666',
        backgroundColor: '#1a1a2eDD',
        padding: { x: 10, y: 6 },
      },
    )
      .setOrigin(0.5, 0)
      .setDepth(151)
      .setAlpha(0);
  }

  show(message: string, color = '#ff6666'): void {
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
    this.text.setText(message);
    this.text.setColor(color);
    this.text.setAlpha(1);

    this.timer = this.scene.time.delayedCall(FADE_DURATION, () => {
      this.scene.tweens.add({
        targets: this.text,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
      });
      this.timer = null;
    });
  }

  reposition(screenW: number): void {
    this.text.setPosition(Math.floor(screenW / 2), 80);
  }

  destroy(): void {
    if (this.timer) this.timer.remove();
    this.text.destroy();
  }
}
