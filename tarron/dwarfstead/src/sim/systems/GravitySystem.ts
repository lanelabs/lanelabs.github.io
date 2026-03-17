import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ClimbableComponent } from '../components/Climbable';
import { RopeComponent } from '../components/Rope';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from '../components/ShapeBlock';
import { BlockMaterial } from '../types';

/** Shared terrain reference — set by Game before systems run. */
let terrainRef: { blocks: BlockMaterial[][]; waterMass: number[][]; width: number; height: number } | null = null;
/** Returns the tethering dwarf's position + rope length if entity is tethered, or null. */
let getTetherInfoFn: ((entityId: number) => { x: number; y: number; ropeLength: number } | null) | null = null;
/** Returns the expected overhead position if entity is held overhead, or null. */
let getOverheadHolderFn: ((entityId: number) => { x: number; y: number } | null) | null = null;

export function setGravityTerrain(terrain: { blocks: BlockMaterial[][]; waterMass: number[][]; width: number; height: number }): void {
  terrainRef = terrain;
}

export function setGravityTetheredCheck(fn: (entityId: number) => { x: number; y: number; ropeLength: number } | null): void {
  getTetherInfoFn = fn;
}

export function setGravityOverheadCheck(fn: (entityId: number) => { x: number; y: number } | null): void {
  getOverheadHolderFn = fn;
}

/** Check if a position has solid ground (terrain or block entity or ladder). */
function isSolidAt(world: World, x: number, y: number): boolean {
  if (!terrainRef) return true;
  if (y < 0 || y >= terrainRef.height) return true;
  if (x < 0 || x >= terrainRef.width) return true;
  // Solid terrain
  if (terrainRef.blocks[y][x] !== BlockMaterial.Air) return true;
  // Ladder
  if (world.query('position', 'climbable').some((e) => {
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === y;
  })) return true;
  // Block entity (loose blocks act as ground)
  if (world.query('position', 'movable').some((e) => {
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === y;
  })) return true;
  return false;
}

/** Check if a block can fall 1 tile down (nothing solid below). */
function canFallOneTile(world: World, entityId: number, x: number, y: number): boolean {
  if (!terrainRef) return false;
  const belowY = y + 1;
  if (belowY >= terrainRef.height) return false;
  if (terrainRef.blocks[belowY][x] !== BlockMaterial.Air) return false;
  // Climbable below (ladder or platform)
  if (world.query('position', 'climbable').some((e) => {
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === belowY;
  })) return false;
  // Other movable block below
  if (world.query('position', 'movable').some((e) => {
    if (e.id === entityId) return false;
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === belowY;
  })) return false;
  // Actor below (dwarf, creature)
  if (world.query('position').some((e) => {
    if (e.id === entityId || e.has('movable') || e.has('climbable')) return false;
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === belowY;
  })) return false;
  return true;
}

export class GravitySystem implements System {
  readonly name = 'gravity';

  update(world: World, _log: GameLog): void {
    if (!terrainRef) return;

    // First pass: settle movable blocks (they fall instantly)
    // Tethered blocks get rope-constrained gravity (fall but limited by rope length)
    for (const entity of world.query('position', 'movable')) {
      const pos = entity.get<PositionComponent>('position')!;
      // Shaping anchor: block is immune to gravity while being actively shaped
      const shape = entity.get<ShapeBlockComponent>('shapeBlock');
      if (shape && shape.progress < CARVING_MAX_TICKS) continue;
      // Overhead anchor: block is immune to gravity while dwarf is directly beneath
      if (getOverheadHolderFn) {
        const oh = getOverheadHolderFn(entity.id);
        if (oh && pos.x === oh.x && pos.y === oh.y) continue;
      }
      const tether = getTetherInfoFn ? getTetherInfoFn(entity.id) : null;
      if (!canFallOneTile(world, entity.id, pos.x, pos.y)) continue;
      if (tether) {
        // Rope-constrained: only fall if rope length allows
        const belowY = pos.y + 1;
        if (Math.max(Math.abs(tether.x - pos.x), Math.abs(tether.y - belowY)) > tether.ropeLength) continue;
      }
      pos.y += 1;
    }

    // Second pass: dwarves and creatures settle instantly to the ground
    for (const entity of world.query('position')) {
      if (entity.has('climbable')) continue;
      if (entity.has('movable')) continue; // Already handled
      if (entity.has('rope')) continue; // Rope entities don't fall

      // Skip dwarves on ropes (rappelling)
      if (entity.has('dwarf')) {
        const d = entity.get<DwarfComponent>('dwarf')!;
        if (d.rappelRopeId !== null) continue;
      }

      const pos = entity.get<PositionComponent>('position')!;
      const belowY = pos.y + 1;
      if (belowY >= terrainRef.height) continue;

      // Dwarves on ladders, ropes, or in water don't fall
      if (entity.has('dwarf')) {
        const onLadder = world.query('position', 'climbable').some((e) => {
          const lp = e.get<PositionComponent>('position')!;
          const c = e.get<ClimbableComponent>('climbable')!;
          return lp.x === pos.x && lp.y === pos.y && c.type === 'ladder';
        });
        if (onLadder) continue;

        const onRope = world.query('position', 'rope').some((e) => {
          const rp = e.get<PositionComponent>('position')!;
          const rc = e.get<RopeComponent>('rope')!;
          return rp.x === pos.x && pos.y >= rp.y && pos.y <= rp.y + rc.length;
        });
        if (onRope) continue;

        // In water — buoyant, don't fall
        if (terrainRef && pos.x >= 0 && pos.x < terrainRef.width && pos.y >= 0 && pos.y < terrainRef.height) {
          if (terrainRef.waterMass[pos.y][pos.x] >= 2) continue;
        }
      }

      // Settle to the lowest supported tile (instant fall)
      let y = pos.y;
      while (y + 1 < terrainRef.height && !isSolidAt(world, pos.x, y + 1)) {
        y++;
      }
      pos.y = y;
    }
  }
}
