import type { GameConfig, Vec2, CommandResult } from './types';
import { BlockMaterial, Season, Direction } from './types';
import { World } from './ecs/World';
import type { System } from './ecs/System';
import type { Entity } from './ecs/Entity';
import { GameLog } from './log/GameLog';
import { SeededRNG } from './rng';
import { TerrainGenerator, type TerrainGrid } from './terrain/TerrainGenerator';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';
import { ClimbableComponent } from './components/Climbable';
import { RopeComponent } from './components/Rope';
import type { Command } from './commands/Command';
import { collapseRopesSupportedBy as collapseRopesImpl } from './ropeCollapse';
import { GravitySystem, setGravityTerrain, setGravityTetheredCheck, setGravityOverheadCheck } from './systems/GravitySystem';
import { MovementSystem } from './systems/MovementSystem';
import { WaterFlowSystem, type WaterFlowState } from './systems/WaterFlowSystem';
import { WATER_FLOOD_THRESHOLD } from './systems/waterCA';
import { CompanionSystem } from './systems/CompanionSystem';
import { CreatureSystem } from './systems/CreatureSystem';
import { ShapingSystem } from './systems/ShapingSystem';
import type { SaveData } from './save';
import { deserializeEntity, restoreNextEntityId, restoreLogEntries } from './save';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from './components/ShapeBlock';
import { ChippingSystem } from './systems/ChippingSystem';
import { OxygenSystem } from './systems/OxygenSystem';
import { CompanionTaskComponent } from './components/CompanionTask';
import { findMovableAt } from './helpers';
import { findSpawnY, spawnMainDwarf, spawnCompanions, spawnCreatures } from './spawnEntities';

export class Game {
  readonly config: GameConfig;
  readonly world: World;
  readonly log: GameLog;
  readonly rng: SeededRNG;

  terrain!: TerrainGrid;
  surfaceY = 0;
  expeditionOver = false;
  supplies = 10;
  /** Set by renderer before execute() to signal ShapingSystem should advance. */
  shapingArmed = false;
  /** Set by renderer before execute() to signal CompanionSystem sell tick should advance. */
  sellTickArmed = false;
  /** Debug noclip/ghost mode — main dwarf ignores collision and gravity. */
  noclipMode = false;
  /** Entity IDs of blocks being dragged by companions — excluded from movable queries. */
  companionDragIds: Set<number> = new Set();

  // Trail of positions the main dwarf has left — used by tethered block towing
  readonly trail: Vec2[] = [];

  // Water & season state (shared with WaterFlowSystem)
  waterState!: WaterFlowState;
  private waterFlowSystem!: WaterFlowSystem;

  private systems: System[] = [];
  private tick = 0;
  private commandHistory: Command[] = [];

  constructor(config: GameConfig) {
    this.config = config;
    this.world = new World();
    this.log = new GameLog();
    this.rng = new SeededRNG(config.seed);
  }

  init(): void {
    const hasOverride = !!this.config.terrainOverride;

    if (hasOverride) {
      this.terrain = this.config.terrainOverride!;
    } else {
      this.terrain = TerrainGenerator.generate(this.config.seed, this.config.worldWidth, this.config.worldHeight);
    }
    this.surfaceY = this.terrain.surfaceY;

    const spawnX = hasOverride ? 3 : Math.floor(this.config.worldWidth / 2);
    const spawnY = findSpawnY(this.terrain, spawnX);
    spawnMainDwarf(this.world, spawnX, spawnY);

    if (!hasOverride) {
      const companionCount = Math.max(0, this.config.startingDwarves - 1);
      spawnCompanions(this.world, spawnX, spawnY, companionCount, this.trail);
      spawnCreatures(this.world, this.terrain, this.rng);
    }

    this.waterState = { season: Season.Dry, seasonTick: 0, seasonLength: this.config.seasonLength ?? 50 };
    this.wireSystems();

    this.log.add('system', 'The expedition begins. Dig deep, build well.');
    this.log.add('narration',
      `${this.config.startingDwarves} ${this.config.startingDwarves > 1 ? 'dwarves' : 'dwarf'} stand${this.config.startingDwarves === 1 ? 's' : ''} at the mountainside.`);
    this.log.add('system', `Season: ${this.waterState.season}. The water table is calm.`);

    if (this.terrain.rooms.length > 0) {
      this.log.add('narration', 'The mountain hides its secrets below...');
    }
  }

  addSystem(system: System): void { this.systems.push(system); }

  /** Execute a command and advance one tick. */
  execute(command: Command): CommandResult {
    if (this.expeditionOver) {
      return { success: false, message: 'The expedition is over.' };
    }

    const result = command.execute(this);
    this.commandHistory.push(command);

    // Advance simulation
    this.tick++;
    this.log.setTick(this.tick);
    for (const system of this.systems) {
      system.update(this.world, this.log);
    }
    this.shapingArmed = false;
    this.sellTickArmed = false;

    // Cleanup: if overhead block is no longer at expected position, clear the reference
    for (const e of this.world.query('dwarf', 'position')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.overheadEntityId !== null) {
        const block = this.world.getEntity(d.overheadEntityId);
        if (!block) {
          d.overheadEntityId = null;
        } else {
          const bp = block.get<PositionComponent>('position')!;
          const dp = e.get<PositionComponent>('position')!;
          if (bp.x !== dp.x || bp.y !== dp.y - 1) {
            d.overheadEntityId = null;
          }
        }
      }
    }

    return result;
  }

  /** Get the block material at a position. */
  getBlock(pos: Vec2): BlockMaterial {
    if (pos.x < 0 || pos.x >= this.terrain.width || pos.y < 0 || pos.y >= this.terrain.height) {
      return BlockMaterial.Bedrock;
    }
    return this.terrain.blocks[pos.y][pos.x];
  }

  /** Set the block material at a position. */
  setBlock(pos: Vec2, material: BlockMaterial): void {
    if (pos.x < 0 || pos.x >= this.terrain.width || pos.y < 0 || pos.y >= this.terrain.height) {
      return;
    }
    this.terrain.blocks[pos.y][pos.x] = material;
    // Solid placement removes water; any change wakes neighbors
    if (material !== BlockMaterial.Air) {
      this.terrain.waterMass[pos.y][pos.x] = 0;
    }
    if (this.waterFlowSystem) {
      this.waterFlowSystem.markUnsettled(pos.x, pos.y);
    }
  }

  /** Check if a position is flooded (waterMass above threshold). */
  isFlooded(pos: Vec2): boolean {
    return this.getWaterMass(pos) >= WATER_FLOOD_THRESHOLD;
  }

  /** Get the water mass at a position (0 if out of bounds or solid). */
  getWaterMass(pos: Vec2): number {
    if (pos.x < 0 || pos.x >= this.terrain.width || pos.y < 0 || pos.y >= this.terrain.height) {
      return 0;
    }
    return this.terrain.waterMass[pos.y][pos.x];
  }

  /** Check if there's a ladder (not platform) at a position — enables climbing. */
  hasLadder(pos: Vec2): boolean {
    return this.world.query('position', 'climbable').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      const c = e.get<ClimbableComponent>('climbable')!;
      return p.x === pos.x && p.y === pos.y && c.type === 'ladder';
    });
  }

  /** Check if there's a platform (not ladder) at a position. */
  hasPlatform(pos: Vec2): boolean {
    return this.world.query('position', 'climbable').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      const c = e.get<ClimbableComponent>('climbable')!;
      return p.x === pos.x && p.y === pos.y && c.type === 'platform';
    });
  }

  /** Check if there's any climbable (ladder or platform) at a position. */
  hasClimbable(pos: Vec2): boolean {
    return this.world.query('position', 'climbable').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === pos.x && p.y === pos.y;
    });
  }

  /** After placing a ladder, unify anchor if two chains just connected. */
  unifyLadderColumn(x: number, y: number, newAnchor: 'top' | 'bottom'): void {
    if (!this.hasLadder({ x, y: y - 1 }) && !this.hasLadder({ x, y: y + 1 })) return;
    let topY = y;
    while (this.hasLadder({ x, y: topY - 1 })) topY--;
    let bottomY = y;
    while (this.hasLadder({ x, y: bottomY + 1 })) bottomY++;
    for (const e of this.world.query('position', 'climbable')) {
      const p = e.get<PositionComponent>('position')!;
      const c = e.get<ClimbableComponent>('climbable')!;
      if (p.x === x && p.y >= topY && p.y <= bottomY && c.type === 'ladder') c.anchorEnd = newAnchor;
    }
  }

  /** Check if any rope entity covers a position (between anchorY and anchorY+length). */
  hasRope(pos: Vec2): boolean {
    return this.world.query('position', 'rope').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      const r = e.get<RopeComponent>('rope')!;
      return p.x === pos.x && pos.y >= p.y && pos.y <= p.y + r.length;
    });
  }

  /** Find the rope entity covering a position, or null. */
  findRopeAt(pos: Vec2): Entity | null {
    return this.world.query('position', 'rope').find((e) => {
      const p = e.get<PositionComponent>('position')!;
      const r = e.get<RopeComponent>('rope')!;
      return p.x === pos.x && pos.y >= p.y && pos.y <= p.y + r.length;
    }) ?? null;
  }

  /** Collapse ropes supported by a removed climbable. See ropeCollapse.ts. */
  collapseRopesSupportedBy(cx: number, cy: number): void {
    collapseRopesImpl(this, cx, cy);
  }

  /** Check if the main dwarf is currently rappelling on a rope. */
  isRappelling(): boolean {
    const md = this.getMainDwarf();
    if (!md) return false;
    const d = md.get<DwarfComponent>('dwarf')!;
    return d.rappelRopeId !== null;
  }

  /** Get the main dwarf entity. */
  getMainDwarf(): Entity | undefined {
    return this.world.query('dwarf', 'position').find((e) => e.get<DwarfComponent>('dwarf')?.isMainDwarf);
  }

  /** Check if a block entity is tethered by any dwarf. */
  isTethered(entityId: number): boolean {
    return this.world.query('dwarf').some((e) => e.get<DwarfComponent>('dwarf')?.tetheredEntityId === entityId);
  }

  /** Get tether anchor info for a block (dwarf position + rope length), or null. */
  getTetherInfo(entityId: number): { x: number; y: number; ropeLength: number } | null {
    for (const e of this.world.query('dwarf', 'position')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.tetheredEntityId === entityId) {
        const p = e.get<PositionComponent>('position')!;
        return { x: p.x, y: p.y, ropeLength: 2 };
      }
    }
    return null;
  }

  /** Check if any movable block would fall on the next tick. */
  hasUnsettledBlocks(): boolean {
    for (const entity of this.world.query('position', 'movable')) {
      const pos = entity.get<PositionComponent>('position')!;
      // Overhead-held blocks don't count as unsettled
      const oh = this.getOverheadHolder(entity.id);
      if (oh && pos.x === oh.x && pos.y === oh.y) continue;
      const belowY = pos.y + 1;
      if (belowY >= this.terrain.height) continue;
      if (this.getBlock({ x: pos.x, y: belowY }) !== BlockMaterial.Air) continue;
      if (this.hasClimbable({ x: pos.x, y: belowY })) continue;
      if (findMovableAt(this, pos.x, belowY, entity.id)) continue;
      // Tether constraint
      const tether = this.getTetherInfo(entity.id);
      if (tether && Math.max(Math.abs(tether.x - pos.x), Math.abs(tether.y - belowY)) > tether.ropeLength) continue;
      return true;
    }
    return false;
  }

  /** Check if any block is being actively shaped (companion still working). */
  hasActiveShaping(): boolean {
    return this.world.query('shapeBlock').some((e) => {
      const s = e.get<ShapeBlockComponent>('shapeBlock')!;
      return s.progress < CARVING_MAX_TICKS;
    });
  }

  /** Check if any companion is on a sell or return errand. */
  hasActiveSellErrand(): boolean {
    return this.world.query('companionTask').some((e) => {
      const ct = e.get<CompanionTaskComponent>('companionTask')!;
      return (ct.pendingErrand === 'sell' && ct.sellPhase > 0) || ct.pendingErrand === 'return';
    });
  }

  /** Check if water CA has unsettled tiles that need more simulation ticks. */
  hasActiveWater(): boolean { return this.waterFlowSystem?.waterActive ?? false; }

  /** Debug info for water system. */
  getWaterDebug(): { active: boolean; streak: number; maxFlow: number; settled: boolean[][] } | null {
    if (!this.waterFlowSystem) return null;
    return {
      active: this.waterFlowSystem.waterActive,
      streak: this.waterFlowSystem.lowFlowStreak,
      maxFlow: this.waterFlowSystem.lastMaxFlow,
      settled: this.waterFlowSystem.settled,
    };
  }

  /** Check if the main dwarf is actively chipping a block. */
  hasActiveChipping(): boolean {
    const md = this.getMainDwarf();
    return md !== undefined && md.has('chipping');
  }

  /** Cancel the main dwarf's chipping and log it. */
  cancelChipping(): void {
    const md = this.getMainDwarf();
    if (md && md.has('chipping')) {
      md.remove('chipping');
      const dComp = md.get<DwarfComponent>('dwarf');
      this.log.add('action', `${dComp?.name ?? 'The dwarf'} stops chipping.`);
    }
  }

  getCurrentTick(): number { return this.tick; }
  getCommandHistory(): readonly Command[] { return this.commandHistory; }

  /** Check if a block entity is held overhead by any dwarf. */
  getOverheadHolder(entityId: number): { x: number; y: number } | null {
    for (const e of this.world.query('dwarf', 'position')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.overheadEntityId === entityId) {
        const p = e.get<PositionComponent>('position')!;
        return { x: p.x, y: p.y - 1 };
      }
    }
    return null;
  }

  private wireSystems(): void {
    setGravityTerrain(this.terrain);
    setGravityTetheredCheck((id) => this.getTetherInfo(id));
    setGravityOverheadCheck((id) => this.getOverheadHolder(id));
    this.addSystem(new MovementSystem());
    this.waterFlowSystem = new WaterFlowSystem({
      terrain: this.terrain,
      state: this.waterState,
    });
    this.addSystem(this.waterFlowSystem);
    this.addSystem(new CreatureSystem());
    // Shaping before gravity so companion is positioned before gravity runs
    this.addSystem(new ShapingSystem({
      terrainWidth: this.terrain.width,
      terrainHeight: this.terrain.height,
      getBlock: (pos) => this.getBlock(pos),
      isArmed: () => this.shapingArmed,
    }));
    // Chipping before gravity so block despawn + dwarf move settle correctly
    this.addSystem(new ChippingSystem());
    // Gravity before companions so companions see the dwarf's final settled position
    this.addSystem(new GravitySystem());
    this.addSystem(new OxygenSystem({
      surfaceY: this.surfaceY,
      terrainWidth: this.terrain.width,
      getWaterMass: (x, y) => this.getWaterMass({ x, y }),
    }));
    this.addSystem(new CompanionSystem({
      surfaceY: this.surfaceY,
      terrainHeight: this.terrain.height,
      terrainWidth: this.terrain.width,
      mainDwarfPos: () => {
        const md = this.getMainDwarf();
        if (!md) return null;
        const p = md.get<PositionComponent>('position')!;
        return { x: p.x, y: p.y };
      },
      mainDwarfFacing: () =>
        this.getMainDwarf()?.get<DwarfComponent>('dwarf')?.facingDirection ?? Direction.Down,
      mainDwarfTetheredPos: () => {
        const d = this.getMainDwarf()?.get<DwarfComponent>('dwarf');
        if (!d?.tetheredEntityId) return null;
        const bp = this.world.getEntity(d.tetheredEntityId)?.get<PositionComponent>('position');
        return bp ? { x: bp.x, y: bp.y } : null;
      },
      getBlock: (pos) => this.getBlock(pos),
      hasClimbable: (pos) => this.hasClimbable(pos),
      hasLadder: (pos) => this.hasLadder(pos),
      hasPlatform: (pos) => this.hasPlatform(pos),
      hasRope: (pos) => this.hasRope(pos),
      isFlooded: (pos) => this.isFlooded(pos),
      getWaterMass: (pos) => this.getWaterMass(pos),
      isTethered: (id) => this.isTethered(id),
      hasMovableAt: (x, y, excludeId?) => !!findMovableAt(this, x, y, excludeId),
      maxSafeFallHeight: this.config.maxSafeFallHeight ?? 1,
      spawnWorld: () => this.world,
      isSellTickArmed: () => this.sellTickArmed,
      isMainDwarfRappelling: () => this.isRappelling(),
      addSupplies: (amount) => { this.supplies += amount; },
      setCompanionDragIds: (ids) => { this.companionDragIds = ids; },
    }));
  }

  /** Restore a Game from serialized save data (skips init/terrain generation). */
  static fromSaveData(data: SaveData): Game {
    const game = new Game(data.config);
    game.tick = data.tick;
    game.log.setTick(data.tick);
    game.expeditionOver = data.expeditionOver;
    game.supplies = data.supplies;
    game.surfaceY = data.surfaceY;

    const wm = data.terrain.waterMass
      ?? TerrainGenerator.emptyWaterMass(data.terrain.width, data.terrain.height);
    // Backward compat: old saves used float 0.0–1.0 water → convert to int 0–5
    for (const row of wm) for (let x = 0; x < row.length; x++) {
      if (row[x] > 0 && row[x] < 1) row[x] = Math.min(5, Math.round(row[x] * 5));
    }
    game.terrain = {
      ...data.terrain, waterMass: wm,
      surfaceHeights: data.terrain.surfaceHeights
        ?? TerrainGenerator.fallbackSurfaceHeights(data.terrain.width, data.terrain.surfaceY),
    };
    game.waterState = { ...data.waterState };
    game.rng.setState(data.rngState);
    game.trail.length = 0;
    for (const v of data.trail) game.trail.push({ x: v.x, y: v.y });
    restoreNextEntityId(data);
    for (const se of data.entities) game.world.addEntity(deserializeEntity(se));
    const logData = restoreLogEntries(data);
    game.log.restore(logData.entries, logData.currentTick);
    game.wireSystems();

    return game;
  }
}
