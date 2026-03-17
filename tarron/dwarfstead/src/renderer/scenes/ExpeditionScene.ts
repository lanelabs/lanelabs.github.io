import Phaser from 'phaser';
import { SimulationBridge } from '../bridge';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { Direction, DirectionVec } from '../../sim/types';
import { MoveCommand } from '../../sim/commands/MoveCommand';
import { AttackCommand } from '../../sim/commands/AttackCommand';
import { HeaveCommand } from '../../sim/commands/HeaveCommand';
import { HoistCommand } from '../../sim/commands/HoistCommand';
import { WaitCommand } from '../../sim/commands/WaitCommand';
import { handleCtrlDirection } from './ctrlInput';
import { handleSpaceAction } from './spaceAction';
import { processChipping, processShaping, processSellErrand, processWater } from './autoTimers';
import type { TimerState } from './autoTimers';
import { ScribePanel } from '../ui/ScribePanel';
import { AlertOverlay } from '../ui/AlertOverlay';
import { drawToolbar } from '../draw/toolbar';
import { drawBackground, drawDebugOverlay, DEBUG_BG } from '../draw/background';
import { drawTerrain } from '../draw/terrain';
import { drawEntities as drawEntitiesLayer } from '../draw/entities';
import { drawCursor, drawRopeOverlay } from '../draw/cursor';
import { SmartMode } from '../smartMode';
import { getActionHintText } from './actionHint';
import { PauseOverlay } from '../ui/PauseOverlay';
import { AdminOverlay } from '../ui/AdminOverlay';
import { loadSlot, clearActiveSlot, getSlotMeta, updateSlotZoom } from '../saveSlots';
import { createFreshBridge, autoSave } from './expeditionHelpers';
import { refreshGradientTextures } from '../draw/gradientTiles';

const MODE_KEY = 'dwarfstead-mode';
const ZOOM_LEVELS = [0, 10, 20, 40, -1]; // 0 = full-map, -1 = close (computed dynamically)
const DEFAULT_ZOOM = 3;

export class ExpeditionScene extends Phaser.Scene {
  private bridge!: SimulationBridge;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private terrainGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private cursorGraphics!: Phaser.GameObjects.Graphics;
  private ropeGraphics!: Phaser.GameObjects.Graphics;
  private toolbarGraphics!: Phaser.GameObjects.Graphics;
  private toolbarLabels!: Phaser.GameObjects.Text[];
  private hintsText!: Phaser.GameObjects.Text;
  private scribePanel!: ScribePanel;
  private alertOverlay!: AlertOverlay;
  private pauseOverlay!: PauseOverlay;
  private adminOverlay!: AdminOverlay;
  private scribeBtn!: Phaser.GameObjects.Text;
  private zoomBtn!: Phaser.GameObjects.Text;
  private suppliesText!: Phaser.GameObjects.Text;
  private actionHint!: Phaser.GameObjects.Text;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyTab!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyCtrl!: Phaser.Input.Keyboard.Key;
  private modeKeys!: Phaser.Input.Keyboard.Key[];
  private inputCooldown = 0;
  private timers: TimerState = { chippingTimer: 0, shapingTimer: 0, sellTimer: 0, waterTimer: 0 };
  private zoomIndex = DEFAULT_ZOOM;
  private currentMode: SmartMode = SmartMode.Mine;
  private hasActed = false;
  private selfSelect = false;
  private suppressHeaveOff = false;
  private pendingHeave: { verticalDir: Direction.Up | Direction.Down; blockX: number; blockY: number; leftAvailable: boolean; rightAvailable: boolean } | null = null;
  private pendingHoist: { leftAvailable: boolean; rightAvailable: boolean } | null = null;
  private paused = false;
  private slotId: string | null = null;
  private slotName = 'Expedition';

  constructor() { super({ key: 'ExpeditionScene' }); }
  init(data?: { slotId?: string; slotName?: string }) {
    this.slotId = data?.slotId ?? null;
    this.slotName = data?.slotName ?? 'Expedition';
    this.paused = false;
  }
  private get gameW(): number { return this.scale.width; }
  private get gameH(): number { return this.scale.height; }
  private get tileSize(): number {
    if (this.zoomIndex === 0) {
      const t = this.bridge.game.terrain;
      return Math.max(1, Math.floor(Math.min(this.gameW / t.width, this.gameH / t.height)));
    }
    if (ZOOM_LEVELS[this.zoomIndex] === -1) {
      return Math.max(1, Math.floor(Math.min(this.gameW / 10, this.gameH / 10)));
    }
    return ZOOM_LEVELS[this.zoomIndex];
  }
  private get tilesX(): number { return Math.ceil(this.gameW / this.tileSize); }
  private get tilesY(): number { return Math.ceil(this.gameH / this.tileSize); }
  private createFreshBridge(): SimulationBridge {
    return createFreshBridge(this.gameW, this.gameH, ZOOM_LEVELS[1]);
  }
  private autoSave(): void {
    autoSave(this.bridge.game, this.slotId, this.slotName, this.currentMode);
  }
  create() {
    const saveData = this.slotId ? loadSlot(this.slotId) : null;
    if (saveData) {
      try {
        this.bridge = SimulationBridge.fromSaveData(saveData);
        this.bridge.game.log.markSessionStart();
        this.bridge.game.log.add('narration', 'You awaken from a brief rest. The mountain still calls.');
      } catch {
        this.bridge = this.createFreshBridge();
      }
    } else {
      this.bridge = this.createFreshBridge();
    }
    // Restore saved mode and zoom
    const savedMode = localStorage.getItem(MODE_KEY);
    if (savedMode) {
      const m = Number(savedMode);
      if (m >= SmartMode.Mine && m <= SmartMode.Demolish) this.currentMode = m;
    }
    if (this.slotId) {
      const meta = getSlotMeta(this.slotId);
      if (meta?.zoom != null && meta.zoom >= 0 && meta.zoom < ZOOM_LEVELS.length) this.zoomIndex = meta.zoom;
    }
    this.bgGraphics = this.add.graphics().setDepth(-1);
    this.terrainGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics();
    this.debugGraphics = this.add.graphics().setDepth(10);
    this.cursorGraphics = this.add.graphics().setDepth(50);
    this.ropeGraphics = this.add.graphics().setDepth(49);
    this.toolbarGraphics = this.add.graphics().setDepth(100);
    this.toolbarLabels = ['Mine', 'Build', 'Command', 'Demolish'].map((name) =>
      this.add.text(0, 0, name, {
        fontSize: '9px', fontFamily: 'monospace', color: '#888898',
      }).setOrigin(0.5, 0).setDepth(101),
    );
    this.hintsText = this.add.text(10, this.gameH - 8,
      'WASD:Move  Shift:Look  Ctrl:Self  Space:Act  1-4:Mode  Tab:Scribe', {
      fontSize: '13px', fontFamily: 'monospace', color: '#a0a0b8',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
    }).setOrigin(0, 1).setDepth(100);
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    [this.keyW, this.keyA, this.keyS, this.keyD] = [K.W, K.A, K.S, K.D].map((k) => kb.addKey(k));
    this.keySpace = kb.addKey(K.SPACE); this.keyTab = kb.addKey(K.TAB);
    this.keyEsc = kb.addKey(K.ESC); this.keyShift = kb.addKey(K.SHIFT); this.keyCtrl = kb.addKey(K.CTRL);
    this.modeKeys = [kb.addKey(K.ONE), kb.addKey(K.TWO), kb.addKey(K.THREE), kb.addKey(K.FOUR)];
    this.scribePanel = new ScribePanel(this, this.bridge.game.log);
    this.alertOverlay = new AlertOverlay(this, this.gameW);
    this.pauseOverlay = new PauseOverlay(this,
      () => { this.paused = false; },
      () => { clearActiveSlot(); this.scene.start('BootScene'); },
      () => { this.pauseOverlay.setContainerVisible(false); this.adminOverlay.show(); });
    this.adminOverlay = new AdminOverlay(this,
      () => { this.adminOverlay.hide(); this.pauseOverlay.show(); });
    const btnStyle = { fontSize: '12px', color: '#e8c170', backgroundColor: '#2a2a3e', padding: { x: 4, y: 2 } };
    this.scribeBtn = this.add.text(this.gameW - 10, 10, '[Scribe]', btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    this.scribeBtn.on('pointerdown', () => this.scribePanel.toggle());
    this.zoomBtn = this.add.text(this.gameW - 10, 36, this.zoomLabel(), btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    this.zoomBtn.on('pointerdown', () => this.cycleZoom());
    // TEMP: regenerate world button — remove later
    const regenBtn = this.add.text(this.gameW - 10, 62, '[Regen World]', btnStyle)
      .setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    regenBtn.on('pointerover', () => regenBtn.setColor('#ff6666'));
    regenBtn.on('pointerout', () => regenBtn.setColor('#e8c170'));
    regenBtn.on('pointerdown', () => {
      this.bridge = this.createFreshBridge();
      this.scribePanel = new ScribePanel(this, this.bridge.game.log);
      this.autoSave(); this.redraw();
    });
    this.suppliesText = this.add.text(10, 10, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8c170', backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
    }).setDepth(100);
    this.actionHint = this.add.text(this.gameW - 10, this.gameH - 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#c0c0d0',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
    }).setOrigin(1, 1).setDepth(100);
    this.scale.on('resize', this.onResize, this);
    refreshGradientTextures(this, this.tileSize);
    this.redraw();
  }
  private zoomLabel(): string {
    return `[Zoom: ${['Full', 'Far', 'Mid', 'Near', 'Close'][this.zoomIndex] ?? 'Close'}]`;
  }
  private cycleZoom() {
    this.zoomIndex = (this.zoomIndex + 1) % ZOOM_LEVELS.length;
    this.zoomBtn.setText(this.zoomLabel());
    if (this.slotId) updateSlotZoom(this.slotId, this.zoomIndex);
    refreshGradientTextures(this, this.tileSize);
    this.redraw();
  }
  private onResize() {
    this.hintsText.setPosition(10, this.gameH - 10);
    this.scribeBtn.setPosition(this.gameW - 10, 10);
    this.zoomBtn.setPosition(this.gameW - 10, 36);
    this.scribePanel.reposition(this.gameW, this.gameH);
    this.alertOverlay.reposition(this.gameW);
    this.pauseOverlay.reposition(this.gameW, this.gameH);
    this.adminOverlay.reposition(this.gameW, this.gameH);
    this.actionHint.setPosition(this.gameW - 10, this.gameH - 8);
    this.redraw();
  }
  update(_time: number, delta: number) {
    // While paused, ESC navigates back through overlays
    if (this.paused) {
      this.inputCooldown -= delta;
      if (this.inputCooldown > 0) return;
      if (this.keyEsc.isDown) {
        if (this.adminOverlay.isVisible()) {
          this.adminOverlay.hide();
          this.pauseOverlay.show();
        } else {
          this.pauseOverlay.hide();
        }
        this.inputCooldown = 200;
      }
      return;
    }
    this.inputCooldown -= delta;
    const mainDwarfForCrouch = this.bridge.game.getMainDwarf();
    if (mainDwarfForCrouch) {
      mainDwarfForCrouch.get<DwarfComponent>('dwarf')!.crouching = this.keyCtrl.isDown;
    }
    if (this.suppressHeaveOff && !this.keyW.isDown) this.suppressHeaveOff = false;
    if (this.selfSelect && !this.keyCtrl.isDown) {
      this.selfSelect = false;
      this.hasActed = false;
      this.pendingHeave = null;
      this.pendingHoist = null;
      this.redraw();
    }
    if (this.bridge.game.expeditionOver) return;
    // --- Time-based sim progress ---
    const timerCtx = {
      game: this.bridge.game, alertOverlay: this.alertOverlay,
      scribePanel: this.scribePanel, keyTab: this.keyTab, keyEsc: this.keyEsc,
      autoSave: () => this.autoSave(), redraw: () => this.redraw(),
      inputCooldown: this.inputCooldown,
    };
    const chipResult = processChipping(delta, this.timers, timerCtx);
    if (chipResult.handled) { this.inputCooldown = chipResult.inputCooldown; return; }
    processShaping(delta, this.timers, timerCtx);
    processSellErrand(delta, this.timers, timerCtx);
    processWater(delta, this.timers, timerCtx);
    if (this.inputCooldown > 0) return;
    if (this.keyTab.isDown) {
      this.scribePanel.toggle();
      this.inputCooldown = 200;
      return;
    }
    if (this.keyEsc.isDown) {
      if (this.pendingHeave || this.pendingHoist) {
        this.pendingHeave = null; this.pendingHoist = null;
        this.inputCooldown = 150; this.redraw(); return;
      }
      if (this.currentMode !== SmartMode.Mine) {
        this.currentMode = SmartMode.Mine;
        localStorage.setItem(MODE_KEY, String(this.currentMode));
        this.inputCooldown = 150; this.redraw(); return;
      }
      // Already in Mine mode, nothing pending → open pause menu
      this.paused = true;
      this.pauseOverlay.show();
      this.inputCooldown = 200;
      return;
    }
    // Pending heave/hoist resolution
    if (this.pendingHeave || this.pendingHoist) {
      const lateralDir = this.keyA.isDown ? Direction.Left : this.keyD.isDown ? Direction.Right : null;
      if (!lateralDir) return;
      if (this.pendingHeave) {
        const ph = this.pendingHeave;
        if (!(lateralDir === Direction.Left ? ph.leftAvailable : ph.rightAvailable)) {
          this.bridge.game.log.add('action', `Blocked ${lateralDir}.`);
          this.inputCooldown = 150; this.redraw(); return;
        }
        this.bridge.game.execute(new HeaveCommand(ph.verticalDir, lateralDir));
        this.pendingHeave = null;
      } else {
        const ph = this.pendingHoist!;
        if (!(lateralDir === Direction.Left ? ph.leftAvailable : ph.rightAvailable)) {
          this.bridge.game.log.add('action', `No block ${lateralDir}.`);
          this.inputCooldown = 150; this.redraw(); return;
        }
        this.bridge.game.execute(new HoistCommand(lateralDir));
        this.pendingHoist = null;
        this.suppressHeaveOff = true;
      }
      this.hasActed = true; this.inputCooldown = 120; this.autoSave(); this.redraw();
      return;
    }
    // Mode switching (1-3)
    for (let i = 0; i < this.modeKeys.length; i++) {
      if (this.modeKeys[i].isDown) {
        this.currentMode = i + 1;
        localStorage.setItem(MODE_KEY, String(this.currentMode));
        this.inputCooldown = 150; this.redraw(); return;
      }
    }
    let acted = false;
    const dir = this.keyA.isDown ? Direction.Left : this.keyD.isDown ? Direction.Right
      : this.keyW.isDown ? Direction.Up : this.keyS.isDown ? Direction.Down : null;
    if (!acted && this.keyCtrl.isDown && !this.selfSelect && !this.keySpace.isDown) {
      this.selfSelect = true; this.hasActed = true;
      this.inputCooldown = 150; this.redraw(); return;
    }
    if (!acted && this.keyCtrl.isDown && this.keySpace.isDown) {
      this.selfSelect = true;
    }
    // Space takes priority over direction (allows lasso while holding a direction)
    if (!acted && this.keySpace.isDown) {
      const game = this.bridge.game;
      const mainDwarf = game.getMainDwarf();
      // Update facing before action so direction + space targets the right tile
      if (dir !== null && mainDwarf) {
        mainDwarf.get<DwarfComponent>('dwarf')!.facingDirection = dir;
      }
      const wasSelfSelect = this.selfSelect;
      if (!this.keyCtrl.isDown) this.selfSelect = false;
      const { result } = handleSpaceAction(game, this.currentMode, wasSelfSelect);
      if (this.currentMode === SmartMode.Command && !result.success && result.message) {
        this.alertOverlay.show(result.message);
      }
      acted = true;
    }
    if (!acted && dir !== null) {
      if (!this.keyCtrl.isDown) this.selfSelect = false;
      const game = this.bridge.game;
      const mainDwarf = game.getMainDwarf();
      if (mainDwarf) {
        const dComp = mainDwarf.get<DwarfComponent>('dwarf')!;
        dComp.facingDirection = dir;
        if (this.keyShift.isDown) {
          this.hasActed = true; this.inputCooldown = 150; this.redraw(); return;
        }
        if (this.keyCtrl.isDown) {
          const result = handleCtrlDirection(game, dir, this.suppressHeaveOff);
          if (result.type === 'executed' && result.suppressHeaveOff) this.suppressHeaveOff = true;
          if (result.type === 'pendingHeave') {
            this.pendingHeave = result.data;
            this.hasActed = true; this.inputCooldown = 150; this.redraw(); return;
          }
          if (result.type === 'pendingHoist') {
            this.pendingHoist = result.data;
            this.hasActed = true; this.inputCooldown = 150; this.redraw(); return;
          }
        } else {
          const pos = mainDwarf.get<PositionComponent>('position')!;
          const d = DirectionVec[dir];
          const hasCreature = game.world.query('position', 'creature').some((e) => {
            const p = e.get<PositionComponent>('position')!;
            return p.x === pos.x + d.x && p.y === pos.y + d.y;
          });
          game.execute(hasCreature ? new AttackCommand(dir) : new MoveCommand(dir));
        }
      }
      acted = true;
    }
    if (acted) {
      this.hasActed = true; this.inputCooldown = 120;
      this.autoSave(); this.redraw();
    }
    if (!acted && this.inputCooldown <= 0 && !this.bridge.game.expeditionOver) {
      if (this.bridge.game.hasUnsettledBlocks()) {
        this.bridge.game.execute(new WaitCommand());
        this.inputCooldown = 150; this.autoSave(); this.redraw();
      }
    }
  }
  private updateActionHint(): void {
    this.actionHint.setText(getActionHintText(this.bridge.game, this.currentMode, {
      pendingHeave: this.pendingHeave, pendingHoist: this.pendingHoist,
      selfSelect: this.selfSelect,
    }));
  }
  private getCamera(): { camX: number; camY: number } {
    const dwarf = this.bridge.game.getMainDwarf();
    if (!dwarf) return { camX: 0, camY: 0 };
    const pos = dwarf.get<PositionComponent>('position')!;
    return {
      camX: pos.x - Math.floor(this.tilesX / 2),
      camY: pos.y - Math.floor(this.tilesY / 2),
    };
  }
  private redraw() {
    const { camX, camY } = this.getCamera();
    const ts = this.tileSize;
    drawBackground(this.bgGraphics, this.bridge.game, ts, this.tilesX, this.tilesY, camX, camY);
    if (DEBUG_BG) {
      drawDebugOverlay(this.bgGraphics, this.bridge.game.terrain, ts, this.tilesX, camX, camY);
    }
    this.debugGraphics.clear();
    drawTerrain(this.terrainGraphics, this.bridge.game, ts, this.tilesX, this.tilesY, camX, camY);
    drawEntitiesLayer(this.entityGraphics, this.bridge.game, ts, this.gameW, this.gameH, camX, camY, this.selfSelect);
    drawCursor(this.cursorGraphics, this.bridge.game, ts, camX, camY, {
      hasActed: this.hasActed, selfSelect: this.selfSelect,
      currentMode: this.currentMode,
      pendingHeave: this.pendingHeave, pendingHoist: this.pendingHoist,
    });
    drawRopeOverlay(this.ropeGraphics, this.bridge.game, ts, camX, camY);
    drawToolbar(this.toolbarGraphics, this.gameW, this.currentMode, this.toolbarLabels);
    this.suppliesText.setText(`Supplies: ${this.bridge.game.supplies}`);
    this.updateActionHint();
    this.scribePanel.refresh();
  }
}
