/**
 * WaterTestScene — dedicated mode for the 7 water lab chambers.
 *
 * Auto-advances the water simulation at 200ms/tick.
 * WASD moves the noclip dwarf (camera follows). +/- zoom. ESC returns to boot menu.
 */

import Phaser from 'phaser';
import { buildWaterTestTerrain } from '../../sim/terrain/waterTestTerrain';
import { WaterSnakeSystem } from '../../sim/water/WaterSnakeSystem';
import type { WaterSaveData } from '../../sim/water/types';
import { drawTerrain } from '../draw/terrain';
import { drawWater } from '../draw/water';
import { drawWaterDebug } from '../draw/waterDebug';
import { drawEntities } from '../draw/entities';
import { Game } from '../../sim/Game';
import { serializeGame } from '../../sim/save';
import type { SaveData } from '../../sim/save';
import { Direction } from '../../sim/types';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { handleNoclipMove } from './noclipMode';

const TICK_MS = 200;
const ZOOM_LEVELS = [8, 16, 24, 32];
const DEFAULT_ZOOM = 2;
const ZOOM_KEY = 'dwarfstead_waterlab_zoom';
const SAVE_KEY = 'dwarfstead_waterlab_save';
const SAVE_VERSION = 2; // bump when terrain layout changes
const SAVE_INTERVAL_MS = 1000;
const MOVE_COOLDOWN = 60;

interface WaterLabSave {
  version?: number;
  game: SaveData;
  water: WaterSaveData;
  tickCount: number;
}

export class WaterTestScene extends Phaser.Scene {
  private waterSystem!: WaterSnakeSystem;
  private simGame!: Game;
  private terrainGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private debugLabels: Phaser.GameObjects.Text[] = [];
  private tickAccumulator = 0;
  private tickCount = 0;
  private zoomIndex = DEFAULT_ZOOM;
  private camX = 0;
  private camY = 0;
  private inputCooldown = 0;
  private lastSaveTime = 0;

  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyPlus!: Phaser.Input.Keyboard.Key;
  private keyMinus!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'WaterTestScene' });
  }

  create() {
    sessionStorage.setItem('dwarfstead_waterlab', '1');
    const savedZoom = Number(sessionStorage.getItem(ZOOM_KEY));
    if (savedZoom >= 0 && savedZoom < ZOOM_LEVELS.length) this.zoomIndex = savedZoom;

    const saved = this.loadSave();
    const testWorld = buildWaterTestTerrain();

    if (saved) {
      this.simGame = Game.fromSaveData(saved.game);
      this.tickCount = saved.tickCount;
      this.waterSystem = new WaterSnakeSystem({
        width: testWorld.terrain.width,
        height: testWorld.terrain.height,
        blocks: this.simGame.terrain.blocks,
        pipes: testWorld.pipes,
        initialWaterVolume: testWorld.initialWaterVolume,
      });
      WaterSnakeSystem.restoreState(this.waterSystem, saved.water);
    } else {
      this.simGame = new Game({
        seed: 1, worldWidth: testWorld.terrain.width,
        worldHeight: testWorld.terrain.height,
        startingDwarves: 0,
        terrainOverride: testWorld.terrain,
      });
      this.simGame.init();
      this.tickCount = 0;
      this.waterSystem = new WaterSnakeSystem({
        width: testWorld.terrain.width,
        height: testWorld.terrain.height,
        blocks: testWorld.terrain.blocks,
        pipes: testWorld.pipes,
        initialWaterVolume: testWorld.initialWaterVolume,
      });
    }

    // Enable noclip on the main dwarf
    const dwarf = this.simGame.getMainDwarf();
    if (dwarf) {
      dwarf.get<DwarfComponent>('dwarf')!.isGhost = true;
      this.simGame.noclipMode = true;
    }

    this.terrainGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics().setDepth(5);
    this.waterGraphics = this.add.graphics().setDepth(3);


    const w = this.scale.width;

    const style = { fontSize: '13px', fontFamily: 'monospace', color: '#a0a0b8',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 } };
    this.add.text(10, this.scale.height - 10,
      'WASD:Move  +/-:Zoom  ESC:Back', style,
    ).setOrigin(0, 1).setDepth(100);

    this.add.text(w / 2, 10,
      'WATER TEST LAB', {
        fontSize: '18px', fontFamily: 'serif', color: '#e8c170',
        backgroundColor: '#1a1a2eCC', padding: { x: 10, y: 4 },
      },
    ).setOrigin(0.5, 0).setDepth(100);

    // Zoom buttons (top-right)
    const btnStyle = { fontSize: '12px', fontFamily: 'monospace', color: '#e8c170',
      backgroundColor: '#2a2a3e', padding: { x: 4, y: 2 } };
    const zoomInBtn = this.add.text(w - 10, 10, '[+]', btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    zoomInBtn.on('pointerdown', () => {
      this.setZoom(this.zoomIndex + 1);
      this.updateCamera();
      this.redraw();
    });
    zoomInBtn.on('pointerover', () => zoomInBtn.setColor('#ffffff'));
    zoomInBtn.on('pointerout', () => zoomInBtn.setColor('#e8c170'));

    const zoomOutBtn = this.add.text(w - 10, 30, '[-]', btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    zoomOutBtn.on('pointerdown', () => {
      this.setZoom(this.zoomIndex - 1);
      this.updateCamera();
      this.redraw();
    });
    zoomOutBtn.on('pointerover', () => zoomOutBtn.setColor('#ffffff'));
    zoomOutBtn.on('pointerout', () => zoomOutBtn.setColor('#e8c170'));

    // Reset water button
    const resetBtn = this.add.text(w - 10, 52, '[Reset Water]', btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => this.resetWater());
    resetBtn.on('pointerover', () => resetBtn.setColor('#ff6666'));
    resetBtn.on('pointerout', () => resetBtn.setColor('#e8c170'));

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keyW = kb.addKey(K.W);
    this.keyA = kb.addKey(K.A);
    this.keyS = kb.addKey(K.S);
    this.keyD = kb.addKey(K.D);
    this.keyEsc = kb.addKey(K.ESC);
    this.keyPlus = kb.addKey(K.PLUS);
    this.keyMinus = kb.addKey(K.MINUS);

    this.updateCamera();
    this.redraw();
  }

  update(_time: number, delta: number) {
    this.tickAccumulator += delta;
    let ticked = false;
    while (this.tickAccumulator >= TICK_MS) {
      this.tickAccumulator -= TICK_MS;
      this.waterSystem.update();
      this.tickCount++;
      ticked = true;
    }
    if (ticked) {
      const now = performance.now();
      if (now - this.lastSaveTime >= SAVE_INTERVAL_MS) {
        this.lastSaveTime = now;
        this.saveState();
      }
    }

    this.inputCooldown -= delta;
    if (this.inputCooldown <= 0) {
      if (this.keyEsc.isDown) {
        sessionStorage.removeItem('dwarfstead_waterlab');
        localStorage.removeItem(SAVE_KEY);
        this.scene.start('BootScene');
        return;
      }

      let moved = false;
      if (this.keyW.isDown) { handleNoclipMove(this.simGame, Direction.Up); moved = true; }
      if (this.keyS.isDown) { handleNoclipMove(this.simGame, Direction.Down); moved = true; }
      if (this.keyA.isDown) { handleNoclipMove(this.simGame, Direction.Left); moved = true; }
      if (this.keyD.isDown) { handleNoclipMove(this.simGame, Direction.Right); moved = true; }

      if (this.keyPlus.isDown) {
        this.setZoom(this.zoomIndex + 1);
        moved = true;
      }
      if (this.keyMinus.isDown) {
        this.setZoom(this.zoomIndex - 1);
        moved = true;
      }

      if (moved) {
        this.inputCooldown = MOVE_COOLDOWN;
        this.updateCamera();
        ticked = true;
      }
    }

    if (ticked) this.redraw();
  }

  private setZoom(idx: number): void {
    this.zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx));
    sessionStorage.setItem(ZOOM_KEY, String(this.zoomIndex));
  }

  private get ts(): number { return ZOOM_LEVELS[this.zoomIndex]; }
  private get tilesX(): number { return Math.ceil(this.scale.width / this.ts) + 1; }
  private get tilesY(): number { return Math.ceil(this.scale.height / this.ts) + 1; }
  private get gameW(): number { return this.scale.width; }
  private get gameH(): number { return this.scale.height; }

  private updateCamera(): void {
    const dwarf = this.simGame.getMainDwarf();
    if (!dwarf) return;
    const pos = dwarf.get<PositionComponent>('position')!;
    this.camX = pos.x - Math.floor(this.tilesX / 2);
    this.camY = pos.y - Math.floor(this.tilesY / 2);
  }

  private resetWater(): void {
    this.waterSystem.reset();
    this.tickCount = 0;
    this.tickAccumulator = 0;
    this.saveState();
    this.redraw();
  }

  private saveState(): void {
    try {
      const data: WaterLabSave = {
        version: SAVE_VERSION,
        game: serializeGame(this.simGame),
        water: this.waterSystem.serializeWater(),
        tickCount: this.tickCount,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch { /* localStorage full or unavailable — silently skip */ }
  }

  private loadSave(): WaterLabSave | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as WaterLabSave;
      if (data.version !== SAVE_VERSION) {
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
      return data;
    } catch { return null; }
  }

  private redraw(): void {
    drawTerrain(this.terrainGraphics, this.simGame,
      this.ts, this.tilesX, this.tilesY, this.camX, this.camY);

    drawEntities(this.entityGraphics, this.simGame,
      this.ts, this.gameW, this.gameH, this.camX, this.camY, false);

    drawWater(this.waterGraphics, this.waterSystem.state,
      this.ts, this.tilesX, this.tilesY, this.camX, this.camY,
      this.simGame.terrain.blocks);

    this.debugLabels = drawWaterDebug(this, this.debugLabels,
      this.waterSystem.state,
      this.ts, this.tilesX, this.tilesY, this.camX, this.camY);
  }
}
