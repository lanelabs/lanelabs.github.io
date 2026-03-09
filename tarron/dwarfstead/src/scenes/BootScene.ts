import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

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

    this.add
      .text(width / 2, height / 2 + 70, '~ Work in Progress ~', {
        fontSize: '14px',
        color: '#666680',
      })
      .setOrigin(0.5);
  }
}
