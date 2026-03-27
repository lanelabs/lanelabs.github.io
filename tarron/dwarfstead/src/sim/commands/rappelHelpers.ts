import type { Game } from '../Game';
import type { Entity } from '../ecs/Entity';
import { Direction, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { RopeComponent } from '../components/Rope';
import { findMovableAt } from '../helpers';

/** Check if the tile below (x, y) is solid ground (terrain, climbable, or movable). */
function hasSolidBelow(game: Game, x: number, y: number): boolean {
  const belowY = y + 1;
  if (belowY >= game.terrain.height) return true;
  if (game.getBlock({ x, y: belowY }) !== BlockMaterial.Air) return true;
  if (game.hasClimbable({ x, y: belowY })) return true;
  if (game.world.query('position', 'movable').some((e) => {
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === belowY;
  })) return true;
  return false;
}

/** Detach the dwarf from the rope without despawning it. */
function detachFromRope(dwarfComp: DwarfComponent): void {
  dwarfComp.rappelRopeId = null;
}

/** Despawn the rope entity, refund recoverable supplies, and clear the dwarf's reference. */
function detachAndDespawnRope(game: Game, dwarfComp: DwarfComponent): void {
  if (dwarfComp.rappelRopeId !== null) {
    const ropeEntity = game.world.getEntity(dwarfComp.rappelRopeId);
    if (ropeEntity) {
      const rc = ropeEntity.get<RopeComponent>('rope');
      if (rc && rc.suppliesRecoverable > 0) {
        game.supplies += rc.suppliesRecoverable;
      }
    }
    game.world.despawn(dwarfComp.rappelRopeId);
    dwarfComp.rappelRopeId = null;
  }
}

/** Auto-detach the dwarf from a rope if standing on solid ground. Returns message if detached. */
export function tryAutoDetach(
  game: Game, dwarfComp: DwarfComponent, pos: PositionComponent,
): string | null {
  if (dwarfComp.rappelRopeId === null) return null;
  if (hasSolidBelow(game, pos.x, pos.y)) {
    detachFromRope(dwarfComp);
    return 'Touches down and detaches from the rope.';
  }
  return null;
}

/** Handle movement while the dwarf is on a rope. Returns null if not rappelling. */
export function handleRappelMovement(
  game: Game, dwarf: Entity, direction: Direction,
): CommandResult | null {
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  if (dwarfComp.rappelRopeId === null) return null;

  const pos = dwarf.get<PositionComponent>('position')!;
  const ropeEntity = game.world.getEntity(dwarfComp.rappelRopeId);
  if (!ropeEntity) {
    // Rope entity was deleted — detach
    dwarfComp.rappelRopeId = null;
    return null;
  }

  const ropePos = ropeEntity.get<PositionComponent>('position')!;
  const ropeComp = ropeEntity.get<RopeComponent>('rope')!;

  if (dwarfComp.tetheredEntityId !== null) {
    return { success: false, message: 'Cannot use a rope while dragging a block.' };
  }

  // Platform/ladder-anchored ropes: the effective top is one tile below the support
  const anchoredAtPlatform = game.hasPlatform({ x: ropePos.x, y: ropePos.y });
  const anchoredBelowLadder = game.hasLadder({ x: ropePos.x, y: ropePos.y - 1 });
  const anchoredBelowSupport = anchoredAtPlatform || anchoredBelowLadder;
  const effectiveTop = anchoredBelowSupport ? ropePos.y + 1 : ropePos.y;

  if (direction === Direction.Left || direction === Direction.Right) {
    if (pos.y <= effectiveTop) {
      return hurdleOffRope(game, dwarf, ropeEntity, direction);
    }
    return { success: false, message: 'Cannot move sideways while on a rope.' };
  }

  if (direction === Direction.Down) {
    // Check if tile below is solid → auto-detach (rope stays)
    if (hasSolidBelow(game, pos.x, pos.y)) {
      detachFromRope(dwarfComp);
      game.log.add('action', `${dwarfComp.name} touches down and detaches from the rope.`);
      return { success: true, message: 'Touched down.' };
    }

    const newY = pos.y + 1;
    if (newY >= game.terrain.height) {
      return { success: false, message: 'Cannot descend further.' };
    }
    if (game.getBlock({ x: pos.x, y: newY }) !== BlockMaterial.Air) {
      detachFromRope(dwarfComp);
      game.log.add('action', `${dwarfComp.name} touches down and detaches from the rope.`);
      return { success: true, message: 'Touched down.' };
    }
    // Also blocked by movable or climbable at destination
    if (game.hasClimbable({ x: pos.x, y: newY }) || game.world.query('position', 'movable').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === pos.x && p.y === newY;
    })) {
      detachFromRope(dwarfComp);
      game.log.add('action', `${dwarfComp.name} touches down and detaches from the rope.`);
      return { success: true, message: 'Touched down.' };
    }

    // If above the rope's current bottom, slide down for free
    const ropeBottom = ropePos.y + ropeComp.length;
    if (pos.y < ropeBottom) {
      pos.y = newY;
      game.log.add('action', `${dwarfComp.name} slides down the rope.`);
    } else {
      // At the bottom — extend rope, costs 1 supply
      if (game.supplies < 1) {
        return { success: false, message: 'No supplies to extend the rope.' };
      }
      pos.y = newY;
      game.supplies -= 1;
      ropeComp.length++;
      ropeComp.suppliesRecoverable++;
      game.log.add('action', `${dwarfComp.name} rappels down.`);
    }

    // Check auto-detach after moving
    const detachMsg = tryAutoDetach(game, dwarfComp, pos);
    if (detachMsg) game.log.add('action', detachMsg);

    return { success: true, message: 'Rappelled down.' };
  }

  if (direction === Direction.Up) {
    // At rope anchor → hurdle off
    if (pos.y <= ropePos.y) {
      return hurdleOffRope(game, dwarf, ropeEntity);
    }

    // Climb up the rope — retract length as we go
    pos.y -= 1;
    ropeComp.length = Math.max(0, ropeComp.length - 1);
    if (ropeComp.suppliesRecoverable > 0) {
      game.supplies += 1;
      ropeComp.suppliesRecoverable--;
    }
    game.log.add('action', `${dwarfComp.name} climbs up the rope.`);

    // If now at anchor, check if we can just detach
    if (pos.y <= ropePos.y) {
      // Platform/ladder anchor: move dwarf up to the support above
      if (anchoredBelowSupport) {
        pos.y = ropePos.y - 1;
      }
      if (hasSolidBelow(game, pos.x, pos.y) || game.hasClimbable({ x: pos.x, y: pos.y })) {
        detachAndDespawnRope(game, dwarfComp);
        game.log.add('action', `${dwarfComp.name} detaches from the rope.`);
      }
    }

    return { success: true, message: 'Climbed up.' };
  }

  return { success: false, message: 'Cannot move in that direction on a rope.' };
}

/**
 * Hurdle off the top of a rope — find solid ground nearby to stand on.
 * When `onlySide` is given, only check that specific direction (for side dismounts).
 */
function hurdleOffRope(
  game: Game, dwarf: Entity, ropeEntity: Entity,
  onlySide?: Direction.Left | Direction.Right,
): CommandResult {
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const pos = dwarf.get<PositionComponent>('position')!;
  const ropePos = ropeEntity.get<PositionComponent>('position')!;

  // If there's a ladder/platform/solid ground at or above anchor → just detach (only for non-side dismounts)
  if (!onlySide) {
    const ladderAbove = game.hasLadder({ x: ropePos.x, y: ropePos.y - 1 });
    const platformHere = game.hasPlatform({ x: ropePos.x, y: ropePos.y });
    if (ladderAbove || platformHere ||
        game.hasClimbable({ x: ropePos.x, y: ropePos.y }) ||
        hasSolidBelow(game, ropePos.x, ropePos.y)) {
      pos.x = ropePos.x;
      pos.y = (platformHere || ladderAbove)
        ? ropePos.y - 1
        : ropePos.y;
      detachAndDespawnRope(game, dwarfComp);
      game.log.add('action', `${dwarfComp.name} climbs off the rope.`);
      return { success: true, message: 'Climbed off rope.' };
    }
  }

  // Scan for a passable tile with solid ground below (1 tile only — no teleporting across gaps)
  const sign = onlySide === Direction.Left ? -1 : onlySide === Direction.Right ? 1 : 0;
  for (let dist = 1; dist <= 1; dist++) {
    const offsets = sign !== 0 ? [sign * dist] : [-dist, dist];
    for (const dx of offsets) {
      const hx = ropePos.x + dx;
      const hy = ropePos.y;
      if (hx < 0 || hx >= game.terrain.width) continue;
      if (game.getBlock({ x: hx, y: hy }) !== BlockMaterial.Air) continue;
      if (game.isFlooded({ x: hx, y: hy })) continue;
      if (hasSolidBelow(game, hx, hy) || game.hasClimbable({ x: hx, y: hy })) {
        pos.x = hx;
        pos.y = hy;
        detachAndDespawnRope(game, dwarfComp);
        game.log.add('action', `${dwarfComp.name} hurdles off the rope.`);
        return { success: true, message: 'Hurdled off rope.' };
      }
    }
  }

  return { success: false, message: 'No safe ground in that direction.' };
}

/**
 * Try to start a rappel when movement would otherwise be blocked by a high drop.
 * Returns the CommandResult if a rappel was started, or null if conditions aren't met.
 */
export function tryStartRappelHorizontal(
  game: Game, dwarf: Entity,
  finalX: number, finalY: number,
): CommandResult | null {
  if (game.noclipMode) return null;
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const pos = dwarf.get<PositionComponent>('position')!;

  if (dwarfComp.tetheredEntityId !== null) return null;
  if (findMovableAt(game, pos.x, pos.y + 1)) return null; // Can't rappel off loose blocks
  if (game.supplies < 1) return null;

  // Create rope entity at the destination (air column)
  const rope = game.world.spawn();
  rope
    .add(new PositionComponent(finalX, finalY))
    .add(new RopeComponent(0, 1));

  dwarfComp.rappelRopeId = rope.id;
  pos.x = finalX;
  pos.y = finalY;
  game.supplies -= 1;

  game.log.add('action', `${dwarfComp.name} hooks a rope and swings over the edge.`);
  return { success: true, message: 'Started rappel.' };
}

/**
 * Try to start a rappel when moving down would be blocked by a high drop.
 * Returns the CommandResult if a rappel was started, or null if conditions aren't met.
 */
export function tryStartRappelVertical(
  game: Game, dwarf: Entity,
): CommandResult | null {
  if (game.noclipMode) return null;
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const pos = dwarf.get<PositionComponent>('position')!;

  if (dwarfComp.tetheredEntityId !== null) return null;
  if (findMovableAt(game, pos.x, pos.y + 1)) return null; // Can't rappel off loose blocks
  if (game.supplies < 1) return null;

  // Platform below: anchor the rope to the platform tile, hang at the anchor
  const platformBelow = game.hasPlatform({ x: pos.x, y: pos.y + 1 });
  if (platformBelow) {
    const anchorY = pos.y + 1;

    const rope = game.world.spawn();
    rope.add(new PositionComponent(pos.x, anchorY)).add(new RopeComponent(0, 1));

    dwarfComp.rappelRopeId = rope.id;
    pos.y = anchorY;
    game.supplies -= 1;

    game.log.add('action', `${dwarfComp.name} ties off to the platform and hangs beneath it.`);
    return { success: true, message: 'Started rappel.' };
  }

  // On a platform: anchor at the platform tile itself, drop one below
  const onPlatform = game.hasPlatform({ x: pos.x, y: pos.y });
  if (onPlatform) {
    const anchorY = pos.y;
    const belowY = pos.y + 1;
    if (belowY >= game.terrain.height) return null;
    if (game.getBlock({ x: pos.x, y: belowY }) !== BlockMaterial.Air) return null;

    const rope = game.world.spawn();
    rope.add(new PositionComponent(pos.x, anchorY)).add(new RopeComponent(0, 1));

    dwarfComp.rappelRopeId = rope.id;
    pos.y = anchorY;
    game.supplies -= 1;

    game.log.add('action', `${dwarfComp.name} ties off to the platform and hangs beneath it.`);
    return { success: true, message: 'Started rappel.' };
  }

  // On a ladder: anchor the rope one tile below the ladder, hang at the anchor
  const onLadder = game.hasLadder({ x: pos.x, y: pos.y });
  if (onLadder) {
    const anchorY = pos.y + 1;
    if (anchorY >= game.terrain.height) return null;
    if (game.getBlock({ x: pos.x, y: anchorY }) !== BlockMaterial.Air) return null;

    const rope = game.world.spawn();
    rope.add(new PositionComponent(pos.x, anchorY)).add(new RopeComponent(0, 1));

    dwarfComp.rappelRopeId = rope.id;
    pos.y = anchorY;
    game.supplies -= 1;

    game.log.add('action', `${dwarfComp.name} ties off to the ladder and drops below it.`);
    return { success: true, message: 'Started rappel.' };
  }

  const newY = pos.y + 1;
  if (newY >= game.terrain.height) return null;
  if (game.getBlock({ x: pos.x, y: newY }) !== BlockMaterial.Air) return null;

  // Create rope entity at current position (departure point)
  const rope = game.world.spawn();
  rope
    .add(new PositionComponent(pos.x, pos.y))
    .add(new RopeComponent(1, 1));

  dwarfComp.rappelRopeId = rope.id;
  pos.y = newY;
  game.supplies -= 1;

  game.log.add('action', `${dwarfComp.name} hooks a rope and descends.`);

  // Check auto-detach after moving
  const detachMsg = tryAutoDetach(game, dwarfComp, pos);
  if (detachMsg) game.log.add('action', detachMsg);

  return { success: true, message: 'Started rappel.' };
}

/**
 * Try to grab a rope at the dwarf's current position (when pressing UP).
 * Can grab from any point along the rope, not just the bottom.
 * Returns CommandResult if grabbed, or null.
 */
export function tryGrabRopeFromBelow(
  game: Game, dwarf: Entity,
): CommandResult | null {
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const pos = dwarf.get<PositionComponent>('position')!;

  if (dwarfComp.tetheredEntityId !== null) return null;

  const ropeEntity = game.findRopeAt({ x: pos.x, y: pos.y });
  if (!ropeEntity) return null;

  const ropeComp = ropeEntity.get<RopeComponent>('rope')!;
  const ropePos = ropeEntity.get<PositionComponent>('position')!;

  // At anchor already — hurdle off instead of grabbing
  if (pos.y <= ropePos.y) return null;

  dwarfComp.rappelRopeId = ropeEntity.id;
  pos.y -= 1;
  // Retract rope from the bottom by 1 tile
  ropeComp.length = Math.max(0, ropeComp.length - 1);
  if (ropeComp.suppliesRecoverable > 0) {
    game.supplies += 1;
    ropeComp.suppliesRecoverable--;
  }

  game.log.add('action', `${dwarfComp.name} grabs the rope and climbs up.`);
  return { success: true, message: 'Grabbed rope.' };
}
