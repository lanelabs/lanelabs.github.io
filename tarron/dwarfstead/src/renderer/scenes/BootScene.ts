import Phaser from 'phaser';

const SAVE_KEY = 'dwarfstead-save';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;
    const hasSave = localStorage.getItem(SAVE_KEY) !== null;

    this.add
      .text(width / 2, height / 2 - 40, 'Dwarfstead', {
        fontSize: '48px',
        fontFamily: 'serif',
        color: '#e8c170',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Dig deep. Build well. Honor the mountain.', {
        fontSize: '16px',
        color: '#a0a0b8',
      })
      .setOrigin(0.5);

    let btnY = height / 2 + 60;

    // Show "Continue Expedition" when a save exists
    if (hasSave) {
      const continueBtn = this.add
        .text(width / 2, btnY, '[ Continue Expedition ]', {
          fontSize: '18px',
          color: '#e8c170',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => continueBtn.setColor('#ffffff'));
      continueBtn.on('pointerout', () => continueBtn.setColor('#e8c170'));
      continueBtn.on('pointerdown', () => {
        this.scene.start('ExpeditionScene');
      });

      btnY += 36;
    }

    const startBtn = this.add
      .text(width / 2, btnY, '[ Begin Expedition ]', {
        fontSize: '18px',
        color: hasSave ? '#a0a0b8' : '#e8c170',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setColor(hasSave ? '#a0a0b8' : '#e8c170'));
    startBtn.on('pointerdown', () => {
      // Clear any existing save to start fresh
      localStorage.removeItem(SAVE_KEY);
      this.scene.start('ExpeditionScene');
    });
  }
}
