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
import { SmartMode } from '../smartMode';
import { redrawScene } from './sceneRedraw';
import { clearActiveSlot, getSlotMeta, updateSlotZoom, updateSlotMapOpen } from '../saveSlots';
import { createFreshBridge, initBridge, autoSave } from './expeditionHelpers';
import { refreshGradientTextures } from '../draw/gradientTiles';
import { createSceneUI, type SceneUI } from './createSceneUI';
import { toggleNoclip, handleNoclipMove, isNoclipActive } from './noclipMode';

const MODE_KEY = 'dwarfstead-mode';
const ZOOM_LEVELS = [10, 20, 40, -1]; // -1 = close (computed dynamically)
const DEFAULT_ZOOM = 2; // "Near" / 40px
const MAP_MARGIN = 12; // px gap around map view

export class ExpeditionScene extends Phaser.Scene {
  private bridge!: SimulationBridge;
  private ui!: SceneUI;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyTab!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyCtrl!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keyBacktick!: Phaser.Input.Keyboard.Key;
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
  private mapOpen = false;
  private backtickWasDown = false;
  private spaceWasDown = false;
  private waterTest = false;
  private slotId: string | null = null;
  private slotName = 'Expedition';
  constructor() { super({ key: 'ExpeditionScene' }); }
  init(data?: { slotId?: string; slotName?: string; waterTest?: boolean }) {
    this.slotId = data?.slotId ?? null;
    this.slotName = data?.slotName ?? 'Expedition';
    this.waterTest = data?.waterTest ?? false;
    if (this.waterTest) this.slotId = null; // no auto-save for test worlds
    this.paused = false;
    this.mapOpen = false;
  }
  private get gameW(): number { return this.scale.width; }
  private get gameH(): number { return this.scale.height; }
  private get tileSize(): number {
    if (this.mapOpen) {
      const t = this.bridge.game.terrain;
      const availW = this.gameW - MAP_MARGIN * 2;
      const availH = this.gameH - MAP_MARGIN * 2;
      return Math.max(1, Math.floor(Math.min(availW / t.width, availH / t.height)));
    }
    if (ZOOM_LEVELS[this.zoomIndex] === -1) {
      return Math.max(1, Math.floor(Math.min(this.gameW / 10, this.gameH / 10)));
    }
    return ZOOM_LEVELS[this.zoomIndex];
  }
  private get tilesX(): number { return Math.ceil(this.gameW / this.tileSize); }
  private get tilesY(): number { return Math.ceil(this.gameH / this.tileSize); }
  private createFreshBridge(): SimulationBridge {
    return createFreshBridge(this.gameW, this.gameH, ZOOM_LEVELS[0]);
  }
  private autoSave(): void {
    autoSave(this.bridge.game, this.slotId, this.slotName, this.currentMode);
  }
  create() {
    this.bridge = initBridge(this.waterTest, this.slotId, () => this.createFreshBridge());
    // Restore saved mode, zoom, and map state
    const savedMode = localStorage.getItem(MODE_KEY);
    if (savedMode) {
      const m = Number(savedMode);
      if (m >= SmartMode.Mine && m <= SmartMode.Demolish) this.currentMode = m;
    }
    if (this.slotId) {
      const meta = getSlotMeta(this.slotId);
      if (meta?.zoom != null && meta.zoom >= 0 && meta.zoom < ZOOM_LEVELS.length) this.zoomIndex = meta.zoom;
      if (meta?.mapOpen) this.mapOpen = true;
    }
    this.ui = createSceneUI(this, this.bridge.game.log, this.zoomLabel(), {
      onResume: () => { this.paused = false; },
      onQuit: () => { clearActiveSlot(); this.scene.start('BootScene'); },
      onOpenAdmin: (po, ao) => { po.setContainerVisible(false); ao.show(); },
      onCloseAdmin: (po, ao) => { ao.hide(); po.show(); },
      onCycleZoom: () => this.cycleZoom(),
      onRegen: () => {
        this.bridge = this.createFreshBridge();
        this.ui.scribePanel = new ScribePanel(this, this.bridge.game.log);
        this.autoSave(); this.redraw();
      },
      onScribeToggle: () => this.ui.scribePanel.toggle(),
      onMapToggle: () => this.toggleMap(),
    });
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    [this.keyW, this.keyA, this.keyS, this.keyD] = [K.W, K.A, K.S, K.D].map((k) => kb.addKey(k));
    this.keySpace = kb.addKey(K.SPACE); this.keyTab = kb.addKey(K.TAB);
    this.keyEsc = kb.addKey(K.ESC); this.keyShift = kb.addKey(K.SHIFT); this.keyCtrl = kb.addKey(K.CTRL);
    this.keyM = kb.addKey(K.M);
    this.keyBacktick = kb.addKey(192); // backtick/tilde key
    this.modeKeys = [kb.addKey(K.ONE), kb.addKey(K.TWO), kb.addKey(K.THREE), kb.addKey(K.FOUR)];
    this.scale.on('resize', this.onResize, this);
    refreshGradientTextures(this, this.tileSize);
    this.redraw();
  }
  private zoomLabel(): string {
    return `[Zoom: ${['Far', 'Mid', 'Near', 'Close'][this.zoomIndex] ?? 'Close'}]`;
  }
  private cycleZoom() {
    this.zoomIndex = (this.zoomIndex + 1) % ZOOM_LEVELS.length;
    this.ui.zoomBtn.setText(this.zoomLabel());
    if (this.slotId) updateSlotZoom(this.slotId, this.zoomIndex);
    refreshGradientTextures(this, this.tileSize);
    this.redraw();
  }
  private toggleMap() {
    this.mapOpen = !this.mapOpen;
    if (this.slotId) updateSlotMapOpen(this.slotId, this.mapOpen);
    refreshGradientTextures(this, this.tileSize);
    this.redraw();
  }
  private onResize() {
    this.ui.hintsText.setPosition(10, this.gameH - 10);
    this.ui.scribePanel.reposition(this.gameW, this.gameH);
    this.ui.alertOverlay.reposition(this.gameW);
    this.ui.pauseOverlay.reposition(this.gameW, this.gameH);
    this.ui.adminOverlay.reposition(this.gameW, this.gameH);
    this.ui.gridOverlay.reposition();
    this.ui.statsPanel.reposition();
    this.ui.actionHint.setPosition(this.gameW - 10, this.gameH - 8);
    this.redraw();
  }
  update(_time: number, delta: number) {
    // While map is open, only M and Esc close it
    if (this.mapOpen) {
      this.inputCooldown -= delta;
      if (this.inputCooldown > 0) return;
      if (this.keyM.isDown || this.keyEsc.isDown) {
        this.toggleMap();
        this.inputCooldown = 200;
      }
      return;
    }
    // While paused, ESC navigates back through overlays
    if (this.paused) {
      this.inputCooldown -= delta;
      if (this.inputCooldown > 0) return;
      if (this.keyEsc.isDown) {
        if (this.ui.adminOverlay.isVisible()) {
          this.ui.adminOverlay.hide();
          this.ui.pauseOverlay.show();
        } else {
          this.ui.pauseOverlay.hide();
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
      game: this.bridge.game, alertOverlay: this.ui.alertOverlay,
      scribePanel: this.ui.scribePanel, keyTab: this.keyTab, keyEsc: this.keyEsc,
      autoSave: () => this.autoSave(), redraw: () => this.redraw(),
      inputCooldown: this.inputCooldown,
    };
    const chipResult = processChipping(delta, this.timers, timerCtx);
    if (chipResult.handled) { this.inputCooldown = chipResult.inputCooldown; return; }
    processShaping(delta, this.timers, timerCtx);
    processSellErrand(delta, this.timers, timerCtx);
    processWater(delta, this.timers, timerCtx);
    // Track single-fire key states before cooldown guard so presses aren't lost
    const backtickDown = this.keyBacktick.isDown;
    const backtickJust = backtickDown && !this.backtickWasDown;
    this.backtickWasDown = backtickDown;
    const spaceDown = this.keySpace.isDown;
    const spaceJust = spaceDown && !this.spaceWasDown;
    this.spaceWasDown = spaceDown;
    if (this.inputCooldown > 0) return;
    // Backtick toggles noclip ghost mode (single-fire: only on initial press)
    if (backtickJust) {
      toggleNoclip(this.bridge.game);
      this.inputCooldown = 200; this.redraw(); return;
    }
    // Noclip mode: WASD moves ghost, all other inputs blocked
    if (isNoclipActive(this.bridge.game)) {
      const dir = this.keyA.isDown ? Direction.Left : this.keyD.isDown ? Direction.Right
        : this.keyW.isDown ? Direction.Up : this.keyS.isDown ? Direction.Down : null;
      if (dir !== null) {
        handleNoclipMove(this.bridge.game, dir);
        this.inputCooldown = 120; this.redraw();
      }
      return;
    }
    // M key opens map
    if (this.keyM.isDown) {
      this.toggleMap();
      this.inputCooldown = 200;
      return;
    }
    if (this.keyTab.isDown) {
      this.ui.scribePanel.toggle();
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
      this.paused = true;
      this.ui.pauseOverlay.show();
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
    if (!acted && spaceJust) {
      const game = this.bridge.game;
      const mainDwarf = game.getMainDwarf();
      if (dir !== null && mainDwarf) {
        mainDwarf.get<DwarfComponent>('dwarf')!.facingDirection = dir;
      }
      const wasSelfSelect = this.selfSelect;
      if (!this.keyCtrl.isDown) this.selfSelect = false;
      const { result } = handleSpaceAction(game, this.currentMode, wasSelfSelect);
      if (this.currentMode === SmartMode.Command && !result.success && result.message) {
        this.ui.alertOverlay.show(result.message);
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
  private redraw() {
    redrawScene({
      ui: this.ui, game: this.bridge.game,
      gameW: this.gameW, gameH: this.gameH,
      ts: this.tileSize, tilesX: this.tilesX, tilesY: this.tilesY,
      mapOpen: this.mapOpen, selfSelect: this.selfSelect,
      hasActed: this.hasActed, currentMode: this.currentMode,
      pendingHeave: this.pendingHeave, pendingHoist: this.pendingHoist,
    });
  }
}
