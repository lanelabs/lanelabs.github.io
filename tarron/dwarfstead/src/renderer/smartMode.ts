import type { Game } from '../sim/Game';
import type { Command } from '../sim/commands/Command';
import { BlockMaterial, Direction, DirectionVec } from '../sim/types';
import { PositionComponent } from '../sim/components/Position';
import { DwarfComponent } from '../sim/components/Dwarf';
import { DigCommand } from '../sim/commands/DigCommand';
import { TetherCommand } from '../sim/commands/TetherCommand';
import { BuildLadderCommand } from '../sim/commands/BuildLadderCommand';
import { BuildLadderAtFeetCommand } from '../sim/commands/BuildLadderAtFeetCommand';
import { DismantleLadderCommand } from '../sim/commands/DismantleLadderCommand';
import { DismantleAtFeetCommand } from '../sim/commands/DismantleAtFeetCommand';
import { CementCommand } from '../sim/commands/CementCommand';
import { ShapeBlockCommand } from '../sim/commands/ShapeBlockCommand';
import { SellBlockCommand } from '../sim/commands/SellBlockCommand';
import { CollectCrateCommand } from '../sim/commands/CollectCrateCommand';
import { WaitCommand } from '../sim/commands/WaitCommand';
import { ShapedChargeCommand } from '../sim/commands/ShapedChargeCommand';
import { ChipCommand } from '../sim/commands/ChipCommand';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from '../sim/components/ShapeBlock';
import { findMovableAt, touchesSolidTerrain } from '../sim/helpers';

export const enum SmartMode {
  Mine = 1,
  Build = 2,
  Command = 3,
  Demolish = 4,
}

/** Cursor color constants. */
export const CursorColor = {
  DIG: 0xff4444,
  ROPE: 0xff8800,
  BUILD: 0x44ff44,
  DISMANTLE: 0xff3333,
  COMMAND: 0x4488ff,
  DEMOLISH: 0xff8800,
} as const;

export interface ResolvedAction {
  command: Command;
  cursorColor: number | null; // null = no cursor (wait)
  cursorDashed: boolean;
  label: string;
  /** When set, cursor draws ladder ghosts at each of these world positions. */
  ladderTiles?: { x: number; y: number }[];
}

import type { Entity } from '../sim/ecs/Entity';

/** Return the entity if it's a completed shaped block, else null. */
function findCompletedShaped(entity: Entity | undefined): Entity | null {
  if (!entity || !entity.has('shapeBlock')) return null;
  const shape = entity.get<ShapeBlockComponent>('shapeBlock')!;
  return shape.progress >= CARVING_MAX_TICKS ? entity : null;
}

export function resolveAction(game: Game, mode: SmartMode, selfSelect = false): ResolvedAction {
  const dwarf = game.getMainDwarf();
  if (!dwarf) {
    return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
  }

  // While rappelling, all modes resolve to wait (no cursor)
  if (game.isRappelling()) {
    return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
  }

  const pos = dwarf.get<PositionComponent>('position')!;
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const facing = dwarfComp.facingDirection;
  const delta = DirectionVec[facing];
  const tx = selfSelect ? pos.x : pos.x + delta.x;
  const ty = selfSelect ? pos.y : pos.y + delta.y;

  if (mode === SmartMode.Command) {
    // Supply crate at target → collect
    const crateEntity = game.world.query('position', 'supplyCrate').find((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === tx && p.y === ty;
    });
    if (crateEntity) {
      return { command: new CollectCrateCommand(tx, ty), cursorColor: CursorColor.COMMAND, cursorDashed: false, label: 'collect' };
    }

    // Completed shaped block → sell (check target tile, then one above)
    const movable = findMovableAt(game, tx, ty);
    const sellCandidate = findCompletedShaped(movable) ?? findCompletedShaped(findMovableAt(game, tx, ty - 1));
    if (sellCandidate) {
      const sp = sellCandidate.get<PositionComponent>('position')!;
      return { command: new SellBlockCommand(sp.x, sp.y), cursorColor: CursorColor.COMMAND, cursorDashed: false, label: 'sell' };
    }

    // Unshaped movable (not rubble) → shape
    if (movable && !movable.has('shapeBlock') && !movable.has('rubble')) {
      return { command: new ShapeBlockCommand(tx, ty), cursorColor: CursorColor.COMMAND, cursorDashed: false, label: 'shape' };
    }
    return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
  }

  if (mode === SmartMode.Demolish) {
    // Always check the block in front for demolish; Ctrl then picks blast vs chip. No chip/blast on rubble.
    const frontX = pos.x + delta.x;
    const frontY = pos.y + delta.y;
    const movable = findMovableAt(game, frontX, frontY);
    if (movable && !movable.has('rubble')) {
      if (selfSelect) {
        return { command: new ShapedChargeCommand(facing), cursorColor: CursorColor.DEMOLISH, cursorDashed: false, label: 'blast' };
      }
      return { command: new ChipCommand(facing), cursorColor: CursorColor.DEMOLISH, cursorDashed: true, label: 'chip' };
    }
    return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
  }

  if (mode === SmartMode.Mine) {
    // 1. If tethered → untether (top priority)
    if (dwarfComp.tetheredEntityId !== null) {
      return { command: new TetherCommand(), cursorColor: CursorColor.ROPE, cursorDashed: false, label: 'untether' };
    }

    // 2. Solid terrain → dig
    const block = game.getBlock({ x: tx, y: ty });
    if (block !== BlockMaterial.Air) {
      return { command: new DigCommand(facing), cursorColor: CursorColor.DIG, cursorDashed: true, label: 'dig' };
    }

    // 3. Movable block at facing tile → lasso
    const hasMovable = game.world.query('position', 'movable').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === tx && p.y === ty;
    });
    if (hasMovable) {
      return { command: new TetherCommand(), cursorColor: CursorColor.ROPE, cursorDashed: false, label: 'lasso' };
    }

    // 4. Nothing → wait
    return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
  }

  // Build mode
  const isHorizontal = facing === Direction.Left || facing === Direction.Right;

  // Self-select (Ctrl+Space): toggle ladder at feet, or convert platform to ladder
  if (selfSelect) {
    // Ladder at feet → remove it (checked first so platforms above don't interfere)
    if (game.hasLadder({ x: tx, y: ty })) {
      return { command: new DismantleAtFeetCommand(), cursorColor: CursorColor.DISMANTLE, cursorDashed: false, label: 'dismantle_ladder' };
    }
    // Platform at feet without ladder → convert to ladder (free, platform supplies material)
    if (game.hasPlatform({ x: tx, y: ty })) {
      return { command: new BuildLadderAtFeetCommand(), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'ladder' };
    }
    // Platform directly above without ladder → convert via upward build (free)
    if (game.hasPlatform({ x: tx, y: ty - 1 }) && !game.hasLadder({ x: tx, y: ty - 1 })) {
      return { command: new BuildLadderCommand(Direction.Up), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'ladder' };
    }
    // Loose block at feet touching solid terrain → cement (not crates)
    const selfMovable = findMovableAt(game, tx, ty);
    if (selfMovable && !selfMovable.has('supplyCrate') && touchesSolidTerrain(game, tx, ty)) {
      return { command: new CementCommand(tx, ty), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'cement' };
    }
    // Nothing → build ladder
    return { command: new BuildLadderAtFeetCommand(), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'ladder' };
  }

  // 1. Ladder at aim tile → dismantle (allows building ladders up to platform undersides)
  if (game.hasLadder({ x: tx, y: ty })) {
    return { command: new DismantleLadderCommand(), cursorColor: CursorColor.DISMANTLE, cursorDashed: false, label: 'dismantle_ladder' };
  }

  // 2. For horizontal: platform one tile below aim (matching build offset) → dismantle
  if (isHorizontal && game.hasPlatform({ x: tx, y: ty + 1 })) {
    return { command: new DismantleLadderCommand(), cursorColor: CursorColor.DISMANTLE, cursorDashed: false, label: 'dismantle_platform' };
  }

  // 3. Loose block at aim tile touching solid terrain → cement (not crates)
  const movable = findMovableAt(game, tx, ty);
  if (movable && !movable.has('supplyCrate') && touchesSolidTerrain(game, tx, ty)) {
    return { command: new CementCommand(tx, ty), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'cement' };
  }

  // 4. Air at build position → build ladder (up/down) or platform (left/right)
  const buildCheckY = isHorizontal ? ty + 1 : ty;
  const block = game.getBlock({ x: tx, y: buildCheckY });
  if (block === BlockMaterial.Air) {
    if (isHorizontal) {
      return { command: new BuildLadderCommand(facing), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'platform' };
    }
    // Vertical ladder: compute preview tiles based on needsBase and supplies
    const onClimbable = game.hasClimbable({ x: pos.x, y: pos.y });
    const needsBase = !onClimbable && facing === Direction.Up;
    const tiles: { x: number; y: number }[] = [];
    if (needsBase) {
      tiles.push({ x: pos.x, y: pos.y });
      if (game.supplies >= 2) tiles.push({ x: tx, y: ty });
    } else {
      tiles.push({ x: tx, y: ty });
    }
    return { command: new BuildLadderCommand(facing), cursorColor: CursorColor.BUILD, cursorDashed: false, label: 'ladder', ladderTiles: tiles };
  }

  // 5. Solid / nothing buildable → wait
  return { command: new WaitCommand(), cursorColor: null, cursorDashed: false, label: 'wait' };
}
