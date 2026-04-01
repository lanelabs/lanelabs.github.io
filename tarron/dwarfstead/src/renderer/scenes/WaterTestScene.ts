/**
 * WaterTestScene — dedicated mode for the 7 water lab chambers.
 *
 * Auto-advances the water simulation at 200ms/tick.
 * WASD moves the noclip dwarf (camera follows). +/- zoom. ESC returns to boot menu.
 */

import Phaser from 'phaser';
import { buildWaterTestTerrain } from '../../sim/terrain/waterTestTerrain';
import { WaterPathSystem } from '../../sim/water/WaterPathSystem';
import type { WaterSaveData } from '../../sim/water/types';
import { drawTerrain } from '../draw/terrain';
import { drawWater } from '../draw/water';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { drawStreamDebugTiles } from '../draw/streamShapes';
import { drawWaterDebug } from '../draw/waterDebug';
import { drawEntities } from '../draw/entities';
import { Game } from '../../sim/Game';
import { serializeGame } from '../../sim/save';
import type { SaveData } from '../../sim/save';
import { BlockMaterial, Direction } from '../../sim/types';
import { pipeNeighborDirs, hasPumpAt } from '../../sim/water/pipeNetwork';
import { findLayer } from '../../sim/water/waterLayer';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { handleNoclipMove } from './noclipMode';

const TICK_MS = 200;
const ZOOM_LEVELS = [8, 16, 24, 32, 48, 64];
const DEFAULT_ZOOM = 2;
const ZOOM_KEY = 'dwarfstead_waterlab_zoom';
const SAVE_KEY = 'dwarfstead_waterlab_save';
const SAVE_VERSION = 4; // pipes included in save data
const SAVE_INTERVAL_MS = 1000;
const MOVE_COOLDOWN = 60;

interface WaterLabSave {
  version?: number;
  game: SaveData;
  water: WaterSaveData;
  tickCount: number;
  mode?: 'water' | 'stone' | 'pipe' | 'pump';
}

export class WaterTestScene extends Phaser.Scene {
  private waterSystem!: WaterPathSystem;
  private simGame!: Game;
  private terrainGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private debugLabels: Phaser.GameObjects.Text[] = [];
  private streamDebugLabels: Phaser.GameObjects.Text[] = [];
  private streamDebugGraphics!: Phaser.GameObjects.Graphics;
  private tickAccumulator = 0;
  private tickCount = 0;
  private zoomIndex = DEFAULT_ZOOM;
  private camX = 0;
  private camY = 0;
  private inputCooldown = 0;
  private lastSaveTime = 0;
  private mode: 'water' | 'stone' | 'pipe' | 'pump' = 'water';
  private modeText!: Phaser.GameObjects.Text;

  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyPlus!: Phaser.Input.Keyboard.Key;
  private keyMinus!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyTab!: Phaser.Input.Keyboard.Key;

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
      if (saved.mode) this.mode = saved.mode;
      this.waterSystem = new WaterPathSystem({
        width: testWorld.terrain.width,
        height: testWorld.terrain.height,
        blocks: this.simGame.terrain.blocks,
        pipes: testWorld.pipes,
        initialWaterVolume: testWorld.initialWaterVolume,
      });
      WaterPathSystem.restoreState(this.waterSystem, saved.water);
    } else {
      this.simGame = new Game({
        seed: 1, worldWidth: testWorld.terrain.width,
        worldHeight: testWorld.terrain.height,
        startingDwarves: 0,
        terrainOverride: testWorld.terrain,
      });
      this.simGame.init();
      this.tickCount = 0;
      this.waterSystem = new WaterPathSystem({
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
    this.streamDebugGraphics = this.add.graphics().setDepth(150);

    const w = this.scale.width;

    const style = { fontSize: '13px', fontFamily: 'monospace', color: '#a0a0b8',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 } };
    this.add.text(10, this.scale.height - 10,
      'WASD:Move  Space:Act  Tab:Mode  +/-:Zoom  ESC:Back', style,
    ).setOrigin(0, 1).setDepth(100);

    this.modeText = this.add.text(w / 2, 42, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#e8c170',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0).setDepth(100);
    this.updateModeText();

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
    this.keySpace = kb.addKey(K.SPACE);
    this.keyTab = kb.addKey(K.TAB);

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

      if (Phaser.Input.Keyboard.JustDown(this.keyTab)) {
        const modes: ('water' | 'stone' | 'pipe' | 'pump')[] = ['water', 'stone', 'pipe', 'pump'];
        this.mode = modes[(modes.indexOf(this.mode) + 1) % modes.length];
        this.updateModeText();
      }

      let moved = false;
      if (this.keyW.isDown) { handleNoclipMove(this.simGame, Direction.Up); moved = true; }
      if (this.keyS.isDown) { handleNoclipMove(this.simGame, Direction.Down); moved = true; }
      if (this.keyA.isDown) { handleNoclipMove(this.simGame, Direction.Left); moved = true; }
      if (this.keyD.isDown) { handleNoclipMove(this.simGame, Direction.Right); moved = true; }

      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) { this.executeAction(); moved = true; }

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
        mode: this.mode,
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

  private executeAction(): void {
    const dwarf = this.simGame.getMainDwarf();
    if (!dwarf) return;
    const pos = dwarf.get<PositionComponent>('position')!;
    if (this.mode === 'water') {
      this.waterSystem.fillAt(pos.x, pos.y);
    } else if (this.mode === 'stone') {
      this.toggleStone(pos.x, pos.y);
    } else if (this.mode === 'pipe') {
      this.togglePipe(pos.x, pos.y);
    } else {
      this.togglePump(pos.x, pos.y);
    }
  }

  private toggleStone(x: number, y: number): void {
    const blocks = this.simGame.terrain.blocks;
    if (y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length) return;
    if (blocks[y][x] === BlockMaterial.Air) {
      // Don't allow placing stone on water tiles
      const layers = this.waterSystem.state.waterLayers;
      if (findLayer(layers, x, y)) return;
      blocks[y][x] = BlockMaterial.Stone;
    } else {
      blocks[y][x] = BlockMaterial.Air;
      this.waterSystem.onBlockRemoved(x, y);
    }
  }

  private togglePipe(x: number, y: number): void {
    const pipes = this.waterSystem.state.pipes;
    if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
    // When removing a pipe, block if it would orphan an adjacent pump
    if (pipes[y][x]) {
      const pumps = this.waterSystem.state.pumps;
      // Check vertical neighbors (up/down) — only those matter since pumps only connect vertically
      for (const [nx, ny] of [[x, y - 1], [x, y + 1]] as const) {
        if (ny < 0 || ny >= pipes.length) continue;
        if (!hasPumpAt(pumps, nx, ny)) continue;
        // Simulate removal: count remaining vertical neighbors for the pump tile
        const ph = pipes.length;
        const pw = ph > 0 ? pipes[0].length : 0;
        const dirs = pipeNeighborDirs(pipes, nx, ny, pw, ph);
        // Vertical neighbors only (pumps block horizontal)
        const vertCount = (dirs.includes(Direction.Up) ? 1 : 0) + (dirs.includes(Direction.Down) ? 1 : 0);
        // This pipe tile is one of those vertical neighbors; removing it drops count by 1
        if (vertCount - 1 < 2) return; // would leave pump with < 2 vertical neighbors
      }
      // Also block if this tile itself has a pump
      if (hasPumpAt(pumps, x, y)) return;
    }
    pipes[y][x] = pipes[y][x] ? null : true;
  }

  private togglePump(x: number, y: number): void {
    const pipes = this.waterSystem.state.pipes;
    if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
    if (!pipes[y][x]) return; // can only place pump on existing pipe
    const pumps = this.waterSystem.state.pumps;
    const idx = pumps.findIndex(p => p.x === x && p.y === y);
    if (idx >= 0) {
      pumps.splice(idx, 1);
    } else {
      // Only allow pumps on vertical mid-pipe (up+down, no left/right, not endpoints)
      const ph = pipes.length;
      const pw = ph > 0 ? pipes[0].length : 0;
      const dirs = pipeNeighborDirs(pipes, x, y, pw, ph);
      if (dirs.includes(Direction.Left) || dirs.includes(Direction.Right)) return;
      if (!dirs.includes(Direction.Up) || !dirs.includes(Direction.Down)) return;
      pumps.push({ x, y, direction: 'up' });
    }
  }

  private updateModeText(): void {
    const labels = ['Water', 'Stone', 'Pipe', 'Pump'];
    const idx = ['water', 'stone', 'pipe', 'pump'].indexOf(this.mode);
    const parts = labels.map((l, i) => i === idx ? `[${l}]` : l);
    this.modeText.setText(parts.join('  '));
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

    // Uncomment to show stream tile debug overlay:
    // this.streamDebugGraphics.clear();
    // this.streamDebugLabels = drawStreamDebugTiles(
    //   this, this.streamDebugGraphics, this.streamDebugLabels, this.ts);
  }
}
