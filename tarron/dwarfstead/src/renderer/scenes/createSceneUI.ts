import Phaser from 'phaser';
import { ScribePanel } from '../ui/ScribePanel';
import { AlertOverlay } from '../ui/AlertOverlay';
import { PauseOverlay } from '../ui/PauseOverlay';
import { AdminOverlay } from '../ui/AdminOverlay';
import { StatsPanel } from '../ui/StatsPanel';
import { GridOverlay } from '../ui/GridOverlay';
import type { GameLog } from '../../sim/log/GameLog';

export interface SceneUI {
  bgGraphics: Phaser.GameObjects.Graphics;
  terrainGraphics: Phaser.GameObjects.Graphics;
  entityGraphics: Phaser.GameObjects.Graphics;
  debugGraphics: Phaser.GameObjects.Graphics;
  cursorGraphics: Phaser.GameObjects.Graphics;
  ropeGraphics: Phaser.GameObjects.Graphics;
  toolbarGraphics: Phaser.GameObjects.Graphics;
  toolbarLabels: Phaser.GameObjects.Text[];
  hintsText: Phaser.GameObjects.Text;
  scribePanel: ScribePanel;
  alertOverlay: AlertOverlay;
  pauseOverlay: PauseOverlay;
  adminOverlay: AdminOverlay;
  statsPanel: StatsPanel;
  gridOverlay: GridOverlay;
  scribeBtn: Phaser.GameObjects.Text;
  zoomBtn: Phaser.GameObjects.Text;
  regenBtn: Phaser.GameObjects.Text;
  mapBtn: Phaser.GameObjects.Text;
  suppliesText: Phaser.GameObjects.Text;
  actionHint: Phaser.GameObjects.Text;
  noclipText: Phaser.GameObjects.Text;
}

export interface SceneUICallbacks {
  onResume: () => void;
  onQuit: () => void;
  onOpenAdmin: (pauseOverlay: PauseOverlay, adminOverlay: AdminOverlay) => void;
  onCloseAdmin: (pauseOverlay: PauseOverlay, adminOverlay: AdminOverlay) => void;
  onCycleZoom: () => void;
  onRegen: () => void;
  onScribeToggle: () => void;
  onMapToggle: () => void;
}

export function createSceneUI(
  scene: Phaser.Scene,
  gameLog: GameLog,
  zoomLabel: string,
  callbacks: SceneUICallbacks,
  opts?: { regenLabel?: string },
): SceneUI {
  const { width: w, height: h } = scene.scale;
  const g = () => scene.add.graphics();

  const bgGraphics = g().setDepth(-1);
  const terrainGraphics = g();
  const entityGraphics = g();
  const debugGraphics = g().setDepth(10);
  const cursorGraphics = g().setDepth(50);
  const ropeGraphics = g().setDepth(49);
  const toolbarGraphics = g().setDepth(100);

  const toolbarLabels = ['Mine', 'Build', 'Command', 'Demolish'].map((name) =>
    scene.add.text(0, 0, name, {
      fontSize: '9px', fontFamily: 'monospace', color: '#888898',
    }).setOrigin(0.5, 0).setDepth(101),
  );

  const hintStyle = {
    fontSize: '13px', fontFamily: 'monospace', color: '#a0a0b8',
    backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
  };
  const hintsText = scene.add.text(10, h - 8,
    'WASD:Move  Shift:Look  Ctrl:Self  Space:Act  1-4:Mode  Tab:Scribe', hintStyle,
  ).setOrigin(0, 1).setDepth(100);

  const scribePanel = new ScribePanel(scene, gameLog);
  const alertOverlay = new AlertOverlay(scene, w);
  const statsPanel = new StatsPanel(scene);
  const gridOverlay = new GridOverlay(scene);

  // Overlays need cross-references, so we wire them with lambdas
  const pauseOverlay = new PauseOverlay(scene,
    () => callbacks.onResume(),
    () => callbacks.onQuit(),
    () => callbacks.onOpenAdmin(pauseOverlay, adminOverlay));
  const adminOverlay = new AdminOverlay(scene,
    () => callbacks.onCloseAdmin(pauseOverlay, adminOverlay),
    statsPanel, gridOverlay);

  const btnStyle = {
    fontSize: '12px', color: '#e8c170', backgroundColor: '#2a2a3e', padding: { x: 4, y: 2 },
  };
  const scribeBtn = scene.add.text(w - 10, 10, '[Scribe]', btnStyle)
    .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
  scribeBtn.on('pointerdown', () => callbacks.onScribeToggle());

  const zoomBtn = scene.add.text(w - 10, 36, zoomLabel, btnStyle)
    .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
  zoomBtn.on('pointerdown', () => callbacks.onCycleZoom());

  const regenBtn = scene.add.text(w - 10, 62, opts?.regenLabel ?? '[Regen World]', btnStyle)
    .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
  regenBtn.on('pointerover', () => regenBtn.setColor('#ff6666'));
  regenBtn.on('pointerout', () => regenBtn.setColor('#e8c170'));
  regenBtn.on('pointerdown', () => callbacks.onRegen());

  const mapBtn = scene.add.text(w - 10, 88, '[Map]', btnStyle)
    .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
  mapBtn.on('pointerdown', () => callbacks.onMapToggle());

  const suppliesText = scene.add.text(10, 10, '', {
    fontSize: '14px', fontFamily: 'monospace', color: '#e8c170',
    backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
  }).setDepth(100);

  const actionHint = scene.add.text(w - 10, h - 8, '', {
    ...hintStyle, color: '#c0c0d0',
  }).setOrigin(1, 1).setDepth(100);

  const noclipText = scene.add.text(10, 30, 'NOCLIP', {
    fontSize: '12px', fontFamily: 'monospace', color: '#ff6600',
    backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 3 },
  }).setDepth(200).setVisible(false);

  return {
    bgGraphics, terrainGraphics, entityGraphics, debugGraphics,
    cursorGraphics, ropeGraphics, toolbarGraphics, toolbarLabels,
    hintsText, scribePanel, alertOverlay, pauseOverlay, adminOverlay,
    statsPanel, gridOverlay, scribeBtn, zoomBtn, regenBtn, mapBtn,
    suppliesText, actionHint, noclipText,
  };
}
