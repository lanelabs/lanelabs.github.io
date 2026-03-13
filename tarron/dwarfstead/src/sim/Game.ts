import type { GameConfig, Vec2, CommandResult } from './types';
import { BlockMaterial, Season, CreatureType, Direction } from './types';
import { World } from './ecs/World';
import type { System } from './ecs/System';
import type { Entity } from './ecs/Entity';
import { GameLog } from './log/GameLog';
import { SeededRNG } from './rng';
import { TerrainGenerator, type TerrainGrid } from './terrain/TerrainGenerator';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';
import { HealthComponent } from './components/Health';
import { CreatureComponent } from './components/Creature';
import { CompanionTaskComponent } from './components/CompanionTask';
import { ClimbableComponent } from './components/Climbable';
import { RopeComponent } from './components/Rope';
import type { Command } from './commands/Command';
import { GravitySystem, setGravityTerrain, setGravityTetheredCheck, setGravityOverheadCheck } from './systems/GravitySystem';
import { MovementSystem } from './systems/MovementSystem';
import { WaterSystem, type WaterState } from './systems/WaterSystem';
import { CompanionSystem } from './systems/CompanionSystem';
import { CreatureSystem } from './systems/CreatureSystem';
import { ShapingSystem } from './systems/ShapingSystem';
import type { SaveData } from './save';
import { deserializeEntity, restoreNextEntityId, restoreLogEntries } from './save';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from './components/ShapeBlock';
import { ChippingSystem } from './systems/ChippingSystem';
import { findMovableAt } from './helpers';

const DWARF_NAMES = [
  'Urist', 'Bomrek', 'Kadol', 'Olin', 'Doren',
  'Rimtar', 'Zuglar', 'Melbil', 'Tosid', 'Ingiz',
];

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

  // Trail of positions the main dwarf has left — companions follow these
  readonly trail: Vec2[] = [];

  // Water & season state (shared with WaterSystem)
  waterState!: WaterState;

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
    // Generate terrain
    this.terrain = TerrainGenerator.generate(
      this.config.seed,
      this.config.worldWidth,
      this.config.worldHeight,
    );
    this.surfaceY = this.terrain.surfaceY;

    // Find a valid surface spawn point (center-ish)
    const spawnX = Math.floor(this.config.worldWidth / 2);
    let spawnY = 0;
    for (let y = 0; y < this.config.worldHeight; y++) {
      if (this.terrain.blocks[y][spawnX] !== BlockMaterial.Air) {
        spawnY = y - 1;
        break;
      }
    }

    // Spawn main dwarf (facing down by default)
    const mainDwarf = this.world.spawn();
    const mainDwarfComp = new DwarfComponent(DWARF_NAMES[0], 'miner', true);
    mainDwarfComp.facingDirection = Direction.Down;
    mainDwarf
      .add(new PositionComponent(spawnX, spawnY))
      .add(mainDwarfComp)
      .add(new HealthComponent(10, 10));

    // Spawn companion dwarves evenly split on both sides of main dwarf
    const companionCount = Math.max(0, this.config.startingDwarves - 1);
    for (let i = 0; i < companionCount; i++) {
      // Alternate sides: left(-1), right(+1), left(-2), right(+2), ...
      const side = i % 2 === 0 ? -1 : 1;
      const dist = Math.floor(i / 2) + 1;
      const cx = spawnX + side * dist;
      const name = DWARF_NAMES[(i + 1) % DWARF_NAMES.length];
      const companion = this.world.spawn();
      companion
        .add(new PositionComponent(cx, spawnY))
        .add(new DwarfComponent(name, i === 0 ? 'porter' : 'miner', false))
        .add(new HealthComponent(8, 8))
        .add(new CompanionTaskComponent('idle'));
      this.trail.push({ x: cx, y: spawnY });
    }

    // Spawn creatures in lairs
    for (const room of this.terrain.rooms) {
      if (room.type === 'lair') {
        const cx = room.x + Math.floor(room.width / 2);
        const cy = room.y + Math.floor(room.height / 2);
        const isBeetle = this.rng.next() > 0.4;
        const creature = this.world.spawn();
        creature
          .add(new PositionComponent(cx, cy))
          .add(new CreatureComponent(
            isBeetle ? 'Cave Beetle' : 'Rock Crab',
            isBeetle ? CreatureType.CaveBeetle : CreatureType.RockCrab,
            isBeetle ? 6 : 10,
            isBeetle ? 6 : 10,
            isBeetle ? 1 : 2,
          ))
          .add(new HealthComponent(isBeetle ? 6 : 10, isBeetle ? 6 : 10));
      }
    }

    // Initialize water state
    this.waterState = {
      waterLevel: this.config.worldHeight - 2,
      season: Season.Dry,
      seasonTick: 0,
      seasonLength: this.config.seasonLength ?? 50,
      waterRiseRate: this.config.waterRiseRate ?? 5,
      worldHeight: this.config.worldHeight,
      surfaceY: this.surfaceY,
    };

    // Wire up systems
    this.wireSystems();

    this.log.add('system', 'The expedition begins. Dig deep, build well.');
    this.log.add('narration',
      `${this.config.startingDwarves} ${this.config.startingDwarves > 1 ? 'dwarves' : 'dwarf'} stand${this.config.startingDwarves === 1 ? 's' : ''} at the mountainside.`);
    this.log.add('system', `Season: ${this.waterState.season}. The water table is calm.`);

    if (this.terrain.rooms.length > 0) {
      this.log.add('narration', 'The mountain hides its secrets below...');
    }
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

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
  }

  /** Check if a position is flooded (below water level and air). */
  isFlooded(pos: Vec2): boolean {
    return pos.y >= this.waterState.waterLevel && this.getBlock(pos) === BlockMaterial.Air;
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

  /**
   * Collapse any ropes whose gallows beam was supported by the climbable at (cx, cy).
   * Detaches the dwarf if rappelling on a collapsed rope and refunds supplies.
   */
  collapseRopesSupportedBy(cx: number, cy: number): void {
    const ropes = this.world.query('position', 'rope');
    for (const ropeEntity of ropes) {
      const rp = ropeEntity.get<PositionComponent>('position')!;
      const rc = ropeEntity.get<RopeComponent>('rope')!;
      // Platform-anchored ropes: the anchor IS the climbable
      if (rp.x === cx && rp.y === cy) {
        this.collapseRope(ropeEntity, rc);
        continue;
      }
      // Gallows ropes: check if this climbable is adjacent and at the anchor row or one below
      if (rp.y !== cy && rp.y !== cy - 1) continue;
      const dist = Math.abs(rp.x - cx);
      if (dist < 1 || dist > 5) continue;
      // Verify this climbable was the nearest support (same scan as rendering)
      let nearest: number | null = null;
      for (const row of [rp.y, rp.y + 1]) {
        for (let d = 1; d <= 5; d++) {
          for (const dx of [-d, d]) {
            const sx = rp.x + dx;
            if (sx < 0 || sx >= this.terrain.width) continue;
            if (this.getBlock({ x: sx, y: row }) !== BlockMaterial.Air || this.hasClimbable({ x: sx, y: row })) {
              if (nearest === null || d < Math.abs(rp.x - nearest)) nearest = sx;
            }
          }
          if (nearest !== null) break;
        }
        if (nearest !== null) break;
      }
      if (nearest === cx) {
        this.collapseRope(ropeEntity, rc);
      }
    }
  }

  private collapseRope(ropeEntity: Entity, rc: RopeComponent): void {
    // Detach dwarf if rappelling on this rope
    const md = this.getMainDwarf();
    if (md) {
      const dc = md.get<DwarfComponent>('dwarf')!;
      if (dc.rappelRopeId === ropeEntity.id) {
        dc.rappelRopeId = null;
      }
    }
    this.supplies += rc.suppliesRecoverable;
    this.world.despawn(ropeEntity.id);
    this.log.add('action', 'The rope collapses without its support.');
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
    return this.world.query('dwarf', 'position').find((e) => {
      const d = e.get<DwarfComponent>('dwarf');
      return d?.isMainDwarf;
    });
  }

  /** Check if a block entity is tethered by any dwarf. */
  isTethered(entityId: number): boolean {
    return this.world.query('dwarf').some((e) => {
      const d = e.get<DwarfComponent>('dwarf');
      return d?.tetheredEntityId === entityId;
    });
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

  getCurrentTick(): number {
    return this.tick;
  }

  getCommandHistory(): readonly Command[] {
    return this.commandHistory;
  }

  /** Wire up all systems (shared between init and fromSaveData). */
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
    this.addSystem(new WaterSystem(this.waterState));
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
      getBlock: (pos) => this.getBlock(pos),
      hasClimbable: (pos) => this.hasClimbable(pos),
      hasLadder: (pos) => this.hasLadder(pos),
      hasPlatform: (pos) => this.hasPlatform(pos),
      hasRope: (pos) => this.hasRope(pos),
      isFlooded: (pos) => this.isFlooded(pos),
      getTrail: () => this.trail,
      isTethered: (id) => this.isTethered(id),
      hasMovableAt: (x, y, excludeId?) => !!findMovableAt(this, x, y, excludeId),
      maxSafeFallHeight: this.config.maxSafeFallHeight ?? 1,
      spawnWorld: () => this.world,
      isSellTickArmed: () => this.sellTickArmed,
      isMainDwarfRappelling: () => this.isRappelling(),
      addSupplies: (amount) => { this.supplies += amount; },
    }));
  }

  /** Restore a Game from serialized save data (skips init/terrain generation). */
  static fromSaveData(data: SaveData): Game {
    const game = new Game(data.config);

    // Restore tick
    game.tick = data.tick;
    game.log.setTick(data.tick);

    // Restore scalar state
    game.expeditionOver = data.expeditionOver;
    game.supplies = data.supplies;
    game.surfaceY = data.surfaceY;

    // Restore terrain (directly, no re-generation)
    game.terrain = {
      width: data.terrain.width,
      height: data.terrain.height,
      blocks: data.terrain.blocks,
      surfaceY: data.terrain.surfaceY,
      rooms: data.terrain.rooms,
    };

    // Restore water state
    game.waterState = { ...data.waterState };

    // Restore RNG
    game.rng.setState(data.rngState);

    // Restore trail
    game.trail.length = 0;
    for (const v of data.trail) {
      game.trail.push({ x: v.x, y: v.y });
    }

    // Restore entities
    restoreNextEntityId(data);
    for (const savedEntity of data.entities) {
      const entity = deserializeEntity(savedEntity);
      game.world.addEntity(entity);
    }

    // Restore log
    const logData = restoreLogEntries(data);
    game.log.restore(logData.entries, logData.currentTick);

    // Wire systems
    game.wireSystems();

    return game;
  }
}
