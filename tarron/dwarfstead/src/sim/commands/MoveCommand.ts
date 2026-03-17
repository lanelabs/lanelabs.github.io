import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { canDisplaceTo, findMovableAt, hasLooseBlockOnTop } from '../helpers';
import {
  handleRappelMovement,
  tryStartRappelHorizontal,
  tryStartRappelVertical,
  tryGrabRopeFromBelow,
} from './rappelHelpers';
/** Rope slack length — block trails this many tiles behind the dwarf. */
const ROPE_LENGTH = 2;

/** Default max tiles a dwarf can safely drop without a ladder. Configurable via GameConfig. */
const DEFAULT_MAX_SAFE_FALL_HEIGHT = 1;

export class MoveCommand implements Command {
  readonly name = 'move';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    const dwarf = game.getMainDwarf();
    if (!dwarf) {
      return { success: false, message: 'No main dwarf found.' };
    }

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    // --- Rappel state: restrict movement while on a rope ---
    const rappelResult = handleRappelMovement(game, dwarf, this.direction);
    if (rappelResult !== null) return rappelResult;

    // --- Try grabbing a rope from below when pressing UP ---
    if (this.direction === Direction.Up) {
      const grabResult = tryGrabRopeFromBelow(game, dwarf);
      if (grabResult !== null) return grabResult;
    }

    const delta = DirectionVec[this.direction];
    const newX = pos.x + delta.x;
    const newY = pos.y + delta.y;

    // Check bounds
    if (newX < 0 || newX >= game.terrain.width || newY < 0 || newY >= game.terrain.height) {
      return { success: false, message: 'Cannot move outside the world.' };
    }

    // Helper: check if a tile is passable (air, no loose blocks)
    // Water is now passable — dwarves can swim through it.
    const isPassable = (x: number, y: number): boolean => {
      if (x < 0 || x >= game.terrain.width || y < 0 || y >= game.terrain.height) return false;
      if (game.getBlock({ x, y }) !== BlockMaterial.Air) return false;
      if (game.world.query('position', 'movable').some((e) => {
        const p = e.get<PositionComponent>('position')!;
        return p.x === x && p.y === y;
      })) return false;
      return true;
    };

    // Swimming: if destination has water, allow free 4-directional movement
    const destInWater = isPassable(newX, newY) && game.isFlooded({ x: newX, y: newY });
    if (destInWater) {
      pos.x = newX;
      pos.y = newY;
      dwarfComp.facingDirection = this.direction;
      if (dwarfComp.rappelRopeId === null) {
        game.trail.unshift({ x: pos.x, y: pos.y });
        if (game.trail.length > 20) game.trail.length = 20;
      }
      game.log.add('action', `${dwarfComp.name} swims ${this.direction}.`);
      return { success: true, message: `Swam ${this.direction}.` };
    }

    // Check if target tile is blocked
    const isHorizontal = this.direction === Direction.Left || this.direction === Direction.Right;
    let finalX = newX;
    let finalY = newY;

    // Rubble swap: dwarf can swap places with rubble (movable + blockType)
    let rubbleAtDest: ReturnType<typeof findMovableAt>;

    if (!isPassable(newX, newY)) {
      // Check if blocked only by rubble on air (not solid terrain)
      if (game.getBlock({ x: newX, y: newY }) === BlockMaterial.Air) {
        const movable = findMovableAt(game, newX, newY);
        if (movable?.has('rubble') && !hasLooseBlockOnTop(game, newX, newY)) {
          rubbleAtDest = movable;
        }
      }

      if (rubbleAtDest) {
        // Rubble at destination — will swap to dwarf's old position after move.
      } else {
        // Attempt hurdle: step up over a 1-high obstacle (horizontal moves only)
        const stepUpY = newY - 1;
        const headroomY = pos.y - 1;
        if (isHorizontal && isPassable(newX, stepUpY) && isPassable(pos.x, headroomY)) {
          // If crouching with overhead, hurdle needs headroom above the step-up destination too
          if (dwarfComp.crouching && dwarfComp.overheadEntityId !== null
            && !canDisplaceTo(game, newX, stepUpY - 1)) {
            return { success: false, message: 'No headroom for the overhead block.' };
          }
          finalX = newX;
          finalY = stepUpY;
        } else {
          // Can't move or hurdle
          const targetBlock = game.getBlock({ x: newX, y: newY });
          if (targetBlock !== BlockMaterial.Air) {
            return { success: false, message: `The way ${this.direction} is blocked by ${targetBlock}.` };
          }
          const hasLooseBlock = game.world.query('position', 'movable').some((e) => {
            const p = e.get<PositionComponent>('position')!;
            return p.x === newX && p.y === newY;
          });
          if (hasLooseBlock) {
            return { success: false, message: `A loose block is in the way. Push or carry it.` };
          }
          return { success: false, message: 'The way is blocked.' };
        }
      }
    }

    // Crouching with overhead block: check headroom at destination before allowing move
    if (dwarfComp.crouching && dwarfComp.overheadEntityId !== null) {
      if (!canDisplaceTo(game, finalX, finalY - 1)) {
        return { success: false, message: 'No headroom for the overhead block.' };
      }
    }

    // For horizontal moves, check the drop at the destination.
    // Block if the fall exceeds the safe height and there's no ladder to descend.
    if (isHorizontal) {
      const maxFall = game.config.maxSafeFallHeight ?? DEFAULT_MAX_SAFE_FALL_HEIGHT;
      let dropDist = 0;
      let checkY = finalY + 1;
      while (checkY < game.terrain.height && game.getBlock({ x: finalX, y: checkY }) === BlockMaterial.Air) {
        // Stop counting if there's a climbable or movable block in the way
        if (game.hasClimbable({ x: finalX, y: checkY })) break;
        if (game.world.query('position', 'movable').some((e) => {
          const p = e.get<PositionComponent>('position')!;
          return p.x === finalX && p.y === checkY;
        })) break;
        dropDist++;
        checkY++;
      }
      if (dropDist > maxFall) {
        // Allow if there's a ladder at the destination to climb down safely
        const hasLadderDest = game.hasLadder({ x: finalX, y: finalY });
        if (!hasLadderDest) {
          // Try rappel instead of blocking
          const rappel = tryStartRappelHorizontal(game, dwarf, finalX, finalY);
          if (rappel) return rappel;
          return { success: false, message: `The drop ${this.direction} is too high. Place a ladder to descend safely.` };
        }
      }
    }

    // Moving down through a platform: measure total drop from the walking space (pos.y),
    // not from the platform tile, so the platform-to-ground distance is included.
    // Skip if there's a ladder at the destination (dwarf can grab it).
    if (this.direction === Direction.Down && game.hasPlatform({ x: finalX, y: finalY }) && !game.hasLadder({ x: finalX, y: finalY })) {
      const maxFall = game.config.maxSafeFallHeight ?? DEFAULT_MAX_SAFE_FALL_HEIGHT;
      let dropDist = 0;
      let checkY = finalY + 1;
      while (checkY < game.terrain.height && game.getBlock({ x: finalX, y: checkY }) === BlockMaterial.Air) {
        if (game.hasClimbable({ x: finalX, y: checkY })) break;
        if (game.world.query('position', 'movable').some((e) => {
          const p = e.get<PositionComponent>('position')!;
          return p.x === finalX && p.y === checkY;
        })) break;
        dropDist++;
        checkY++;
      }
      const totalDrop = (finalY - pos.y) + dropDist;
      if (totalDrop > maxFall) {
        // Try rappel instead of blocking
        const rappel = tryStartRappelVertical(game, dwarf);
        if (rappel) return rappel;
        return { success: false, message: 'Too far to drop through the platform. Build a ladder to descend.' };
      }
    }

    // Moving down into air (e.g., off bottom of ladder): check total drop from starting position
    if (this.direction === Direction.Down && !game.hasClimbable({ x: finalX, y: finalY })) {
      const maxFall = game.config.maxSafeFallHeight ?? DEFAULT_MAX_SAFE_FALL_HEIGHT;
      let dropDist = 0;
      let checkY = finalY + 1;
      while (checkY < game.terrain.height && game.getBlock({ x: finalX, y: checkY }) === BlockMaterial.Air) {
        if (game.hasClimbable({ x: finalX, y: checkY })) break;
        if (game.world.query('position', 'movable').some((e) => {
          const p = e.get<PositionComponent>('position')!;
          return p.x === finalX && p.y === checkY;
        })) break;
        dropDist++;
        checkY++;
      }
      const totalDrop = (finalY - pos.y) + dropDist;
      if (totalDrop > maxFall) {
        // Try rappel instead of blocking
        const rappel = tryStartRappelVertical(game, dwarf);
        if (rappel) return rappel;
        return { success: false, message: 'The drop is too high. Build a ladder to descend safely.' };
      }
    }

    // Moving up requires a ladder at current or destination, OR standing in a platform tile
    // (platform only helps if you're already inside the platform block, not from below it)
    if (this.direction === Direction.Up) {
      const hasLadderHere = game.hasLadder({ x: pos.x, y: pos.y });
      const hasLadderDest = game.hasLadder({ x: finalX, y: finalY });
      const hasPlatformHere = game.hasPlatform({ x: pos.x, y: pos.y });
      if (!hasLadderHere && !hasLadderDest && !hasPlatformHere) {
        return { success: false, message: 'Cannot climb without a ladder.' };
      }
    }

    const oldX = pos.x;
    const oldY = pos.y;
    pos.x = finalX;
    pos.y = finalY;
    dwarfComp.facingDirection = this.direction;

    // Swap rubble to dwarf's old position (gravity will settle it)
    if (rubbleAtDest) {
      const rp = rubbleAtDest.get<PositionComponent>('position')!;
      rp.x = oldX;
      rp.y = oldY;
    }

    // Record old position in trail — CompanionSystem (runs after gravity)
    // will reorder companions around the dwarf's settled position.
    // Skip trail updates while rappelling so companions stay at pre-rappel positions.
    if (dwarfComp.rappelRopeId === null) {
      game.trail.unshift({ x: oldX, y: oldY });
      const maxTrail = 20;
      if (game.trail.length > maxTrail) {
        game.trail.length = maxTrail;
      }
    }

    // Update carried item position
    if (dwarfComp.carryingEntityId !== null) {
      const carried = game.world.getEntity(dwarfComp.carryingEntityId);
      if (carried) {
        const cp = carried.get<PositionComponent>('position')!;
        cp.x = finalX;
        cp.y = finalY;
      } else {
        dwarfComp.carryingEntityId = null;
      }
    }

    // Sync overhead block: crouching → block follows; standing → block stays (gravity drops it)
    if (dwarfComp.overheadEntityId !== null) {
      if (dwarfComp.crouching) {
        const ob = game.world.getEntity(dwarfComp.overheadEntityId);
        if (ob) {
          const op = ob.get<PositionComponent>('position')!;
          op.x = finalX;
          op.y = finalY - 1;
        } else {
          dwarfComp.overheadEntityId = null;
        }
      }
      // Standing: block stays where it is — gravity will handle it, Game.execute cleanup clears overheadEntityId
    }

    // Tow tethered block — follows the dwarf's trail like a follower
    if (dwarfComp.tetheredEntityId !== null) {
      const block = game.world.getEntity(dwarfComp.tetheredEntityId);
      if (!block) {
        dwarfComp.tetheredEntityId = null;
      } else {
        const bp = block.get<PositionComponent>('position')!;
        const dist = Math.max(Math.abs(finalX - bp.x), Math.abs(finalY - bp.y));
        if (dist > ROPE_LENGTH && game.trail.length >= ROPE_LENGTH) {
          let target = game.trail[ROPE_LENGTH - 1];

          // Prevent block from being flung past the dwarf when reversing direction.
          // If the trail target would place the block on the opposite X-side of the
          // dwarf from where it currently is, fall back to directly behind (trail[0]).
          const curSideX = Math.sign(bp.x - finalX);
          const targetSideX = Math.sign(target.x - finalX);
          if (curSideX !== 0 && targetSideX !== 0 && curSideX !== targetSideX) {
            target = game.trail[0];
          }
          if (game.getBlock({ x: target.x, y: target.y }) === BlockMaterial.Air) {
            bp.x = target.x;
            bp.y = target.y;
            // If target is occupied by another block, scan upward to find air
            while (bp.y > 0 && game.world.query('position', 'movable').some((e) => {
              if (e.id === block.id) return false;
              const p = e.get<PositionComponent>('position')!;
              return p.x === bp.x && p.y === bp.y;
            })) {
              bp.y--;
            }
            // Rope-constrained gravity: block falls but only as far as rope allows
            while (bp.y + 1 < game.terrain.height) {
              if (game.getBlock({ x: bp.x, y: bp.y + 1 }) !== BlockMaterial.Air) break;
              if (game.hasClimbable({ x: bp.x, y: bp.y + 1 })) break;
              if (game.world.query('position', 'movable').some((e) => {
                if (e.id === block.id) return false;
                const p = e.get<PositionComponent>('position')!;
                return p.x === bp.x && p.y === bp.y + 1;
              })) break;
              // Would falling one more tile exceed rope length?
              const newDist = Math.max(Math.abs(finalX - bp.x), Math.abs(finalY - (bp.y + 1)));
              if (newDist > ROPE_LENGTH) break;
              bp.y++;
            }
          }
        }
      }
    }

    const hurdled = finalY !== newY;
    if (rubbleAtDest) {
      game.log.add('action', `${dwarfComp.name} pushes through rubble ${this.direction}.`);
    } else if (hurdled) {
      game.log.add('action', `${dwarfComp.name} clambers ${this.direction} over an obstacle.`);
    } else {
      game.log.add('action', `${dwarfComp.name} moves ${this.direction}.`);
    }

    // Collect any 'waiting' companion at the new position
    for (const e of game.world.query('dwarf', 'position', 'companionTask')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.isMainDwarf) continue;
      const ct = e.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'waiting') continue;
      const cp = e.get<PositionComponent>('position')!;
      if (cp.x === finalX && cp.y === finalY) {
        ct.task = 'idle';
        ct.shapeTargetId = null;
        game.log.add('narration', `${d.name} rejoins the band.`);
      }
    }

    return { success: true, message: hurdled ? `Hurdled ${this.direction}.` : `Moved ${this.direction}.` };
  }
}
