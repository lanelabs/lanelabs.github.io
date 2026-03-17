import type { GameConfig, Vec2, HiddenRoom, BlockMaterial, Direction, CreatureType } from './types';
import type { LogEntry, LogCategory } from './log/GameLog';
import type { WaterFlowState } from './systems/WaterFlowSystem';
import type { Game } from './Game';
import type { Component } from './ecs/Component';
import { Entity, setNextEntityId } from './ecs/Entity';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';
import { HealthComponent } from './components/Health';
import { CreatureComponent } from './components/Creature';
import { CompanionTaskComponent } from './components/CompanionTask';
import { BlockTypeComponent } from './components/BlockType';
import { ClimbableComponent } from './components/Climbable';
import { MovableComponent } from './components/Movable';
import { ShapeBlockComponent } from './components/ShapeBlock';
import { SupplyCrateComponent } from './components/SupplyCrate';
import { RopeComponent } from './components/Rope';
import { RubbleComponent } from './components/Rubble';
import { ChippingComponent } from './components/Chipping';
import { OxygenComponent } from './components/Oxygen';

/** Serialized representation of a single component. */
export interface SavedComponent {
  kind: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/** Serialized representation of a single entity. */
export interface SavedEntity {
  id: number;
  components: SavedComponent[];
}

/** Full serializable game snapshot. */
export interface SaveData {
  version: 1 | 2;
  config: GameConfig;
  tick: number;
  expeditionOver: boolean;
  supplies: number;
  surfaceY: number;
  terrain: {
    width: number;
    height: number;
    blocks: BlockMaterial[][];
    waterMass?: number[][];
    surfaceY: number;
    surfaceHeights?: number[];
    rooms: HiddenRoom[];
  };
  waterState: WaterFlowState;
  rngState: number;
  trail: Vec2[];
  entities: SavedEntity[];
  nextEntityId: number;
  log: {
    entries: LogEntry[];
    currentTick: number;
  };
}

// --- Component serializers ---

type ComponentSerializer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize: (c: any) => Record<string, any>;
};

const componentSerializers: Record<string, ComponentSerializer> = {
  position: { serialize: (c) => ({ x: c.x, y: c.y }) },
  dwarf: {
    serialize: (c) => ({
      name: c.name, specialty: c.specialty, isMainDwarf: c.isMainDwarf,
      carryingEntityId: c.carryingEntityId, facingDirection: c.facingDirection,
      tetheredEntityId: c.tetheredEntityId, overheadEntityId: c.overheadEntityId,
      crouching: c.crouching, rappelRopeId: c.rappelRopeId,
    }),
  },
  health: { serialize: (c) => ({ current: c.current, max: c.max }) },
  creature: {
    serialize: (c) => ({
      name: c.name, creatureType: c.creatureType,
      hp: c.hp, maxHp: c.maxHp, damage: c.damage,
    }),
  },
  companionTask: {
    serialize: (c) => ({
      task: c.task, ticksRemaining: c.ticksRemaining,
      targetEntityId: c.targetEntityId, shapeTargetId: c.shapeTargetId,
      pendingErrand: c.pendingErrand, sellPhase: c.sellPhase,
      dragEntityId: c.dragEntityId, edgeX: c.edgeX,
    }),
  },
  shapeBlock: {
    serialize: (c) => ({
      companionId: c.companionId, progress: c.progress, workTicks: c.workTicks, carvingSide: c.carvingSide,
    }),
  },
  blockType: { serialize: (c) => ({ material: c.material }) },
  climbable: { serialize: (c) => ({ type: c.type ?? 'ladder', anchorEnd: c.anchorEnd ?? null }) },
  movable: { serialize: (c) => ({ weight: c.weight }) },
  supplyCrate: { serialize: (c) => ({ suppliesInside: c.suppliesInside }) },
  rope: { serialize: (c) => ({ length: c.length, suppliesRecoverable: c.suppliesRecoverable }) },
  rubble: { serialize: () => ({}) },
  chipping: { serialize: (c) => ({ targetEntityId: c.targetEntityId, direction: c.direction, progress: c.progress }) },
  oxygen: { serialize: (c) => ({ current: c.current, max: c.max }) },
};

// --- Component deserializers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentDeserializer = (data: Record<string, any>) => Component;

const componentDeserializers: Record<string, ComponentDeserializer> = {
  position: (d) => new PositionComponent(d.x, d.y),
  dwarf: (d) => {
    const c = new DwarfComponent(d.name, d.specialty, d.isMainDwarf);
    c.carryingEntityId = d.carryingEntityId;
    c.facingDirection = d.facingDirection as Direction;
    c.tetheredEntityId = d.tetheredEntityId;
    c.overheadEntityId = d.overheadEntityId ?? null;
    c.crouching = d.crouching ?? false;
    c.rappelRopeId = d.rappelRopeId ?? null;
    return c;
  },
  health: (d) => new HealthComponent(d.current, d.max),
  creature: (d) => new CreatureComponent(
    d.name, d.creatureType as CreatureType, d.hp, d.maxHp, d.damage,
  ),
  companionTask: (d) => {
    const c = new CompanionTaskComponent(d.task);
    c.ticksRemaining = d.ticksRemaining;
    c.targetEntityId = d.targetEntityId;
    c.shapeTargetId = d.shapeTargetId ?? null;
    c.pendingErrand = d.pendingErrand ?? null;
    c.sellPhase = d.sellPhase ?? 0;
    c.dragEntityId = d.dragEntityId ?? null;
    c.edgeX = d.edgeX ?? 0;
    // path is transient — CompanionSystem recomputes based on sellPhase
    return c;
  },
  shapeBlock: (d) => {
    const c = new ShapeBlockComponent(d.companionId);
    c.progress = d.progress;
    c.workTicks = d.workTicks ?? 0;
    c.carvingSide = d.carvingSide;
    return c;
  },
  blockType: (d) => new BlockTypeComponent(d.material),
  climbable: (d) => {
    const c = new ClimbableComponent(d.type ?? 'ladder');
    c.anchorEnd = d.anchorEnd ?? null;
    return c;
  },
  movable: (d) => new MovableComponent(d.weight),
  supplyCrate: (d) => new SupplyCrateComponent(d.suppliesInside ?? 1),
  rope: (d) => {
    const c = new RopeComponent(d.length);
    c.suppliesRecoverable = d.suppliesRecoverable ?? d.length;
    return c;
  },
  rubble: () => new RubbleComponent(),
  chipping: (d) => {
    const c = new ChippingComponent(d.targetEntityId, d.direction);
    c.progress = d.progress ?? 0;
    return c;
  },
  oxygen: (d) => {
    const c = new OxygenComponent(d.max ?? 10);
    c.current = d.current ?? c.max;
    return c;
  },
};

// --- Serialize ---

function serializeEntity(entity: Entity): SavedEntity {
  const components: SavedComponent[] = [];
  for (const kind of entity.kinds()) {
    const comp = entity.get(kind);
    if (!comp) continue;
    const serializer = componentSerializers[kind];
    if (serializer) {
      components.push({ kind, data: serializer.serialize(comp) });
    }
  }
  return { id: entity.id, components };
}

export function serializeGame(game: Game): SaveData {
  return {
    version: 2,
    config: { ...game.config },
    tick: game.getCurrentTick(),
    expeditionOver: game.expeditionOver,
    supplies: game.supplies,
    surfaceY: game.surfaceY,
    terrain: {
      width: game.terrain.width,
      height: game.terrain.height,
      blocks: game.terrain.blocks,
      waterMass: game.terrain.waterMass,
      surfaceY: game.terrain.surfaceY,
      surfaceHeights: game.terrain.surfaceHeights,
      rooms: game.terrain.rooms,
    },
    waterState: { ...game.waterState },
    rngState: game.rng.getState(),
    trail: game.trail.map((v) => ({ ...v })),
    entities: game.world.all().map(serializeEntity),
    nextEntityId: Math.max(...game.world.all().map((e) => e.id), 0) + 1,
    log: {
      entries: game.log.all().map((e) => ({ ...e })),
      currentTick: game.getCurrentTick(),
    },
  };
}

// --- Deserialize ---

export function deserializeEntity(saved: SavedEntity): Entity {
  const entity = new Entity(saved.id);
  for (const sc of saved.components) {
    const deserializer = componentDeserializers[sc.kind];
    if (deserializer) {
      entity.add(deserializer(sc.data));
    }
  }
  return entity;
}

export function restoreNextEntityId(data: SaveData): void {
  setNextEntityId(data.nextEntityId);
}

export function restoreLogEntries(
  data: SaveData,
): { entries: LogEntry[]; currentTick: number } {
  return {
    entries: data.log.entries.map((e) => ({
      tick: e.tick,
      category: e.category as LogCategory,
      message: e.message,
    })),
    currentTick: data.log.currentTick,
  };
}
