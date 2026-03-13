import Phaser from 'phaser';
import { BootScene } from './renderer/scenes/BootScene';
import { ExpeditionScene } from './renderer/scenes/ExpeditionScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, ExpeditionScene],
  pixelArt: true,
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
  },
};

new Phaser.Game(config);
