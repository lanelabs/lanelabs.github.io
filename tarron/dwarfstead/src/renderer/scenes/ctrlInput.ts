import type { Game } from '../../sim/Game';
import { Direction, DirectionVec } from '../../sim/types';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { MoveCommand } from '../../sim/commands/MoveCommand';
import { AttackCommand } from '../../sim/commands/AttackCommand';
import { ShoveCommand } from '../../sim/commands/ShoveCommand';
import { HeaveCommand } from '../../sim/commands/HeaveCommand';
import { HoistCommand } from '../../sim/commands/HoistCommand';
import { findMovableAt, canDisplaceTo, findHoistableBlock } from '../../sim/helpers';

export interface PendingHeave {
  verticalDir: Direction.Up | Direction.Down;
  blockX: number; blockY: number;
  leftAvailable: boolean; rightAvailable: boolean;
}

export interface PendingHoist {
  leftAvailable: boolean; rightAvailable: boolean;
}

export type CtrlResult =
  | { type: 'executed'; suppressHeaveOff?: boolean }
  | { type: 'pendingHeave'; data: PendingHeave }
  | { type: 'pendingHoist'; data: PendingHoist };

/**
 * Handle Ctrl+direction input. Returns what happened so the scene
 * can update pending states / redraw as needed.
 * @param suppressHeaveOff When true, Ctrl+Up with overhead skips heave-off
 *   (W key still held from the hoist that just happened).
 */
export function handleCtrlDirection(game: Game, dir: Direction, suppressHeaveOff = false): CtrlResult {
  const mainDwarf = game.getMainDwarf();
  if (!mainDwarf) return { type: 'executed' };
  const dComp = mainDwarf.get<DwarfComponent>('dwarf')!;
  const pos = mainDwarf.get<PositionComponent>('position')!;

  // Ctrl+A/D: overhead → crouched move, else shove
  if (dir === Direction.Left || dir === Direction.Right) {
    if (dComp.overheadEntityId !== null) {
      game.execute(new MoveCommand(dir));
    } else {
      game.execute(new ShoveCommand(dir));
    }
    return { type: 'executed' };
  }

  // Ctrl+Up
  if (dir === Direction.Up) {
    if (dComp.overheadEntityId !== null) {
      if (suppressHeaveOff) {
        // W still held from hoist — move up (ladder climb), don't heave off
        game.execute(new MoveCommand(dir));
        return { type: 'executed' };
      }
      return heaveOffOverhead(game, pos, dComp);
    }
    const result = hoistOrHeaveUp(game, dir, pos, dComp);
    // If a hoist pickup just happened, tell the scene to suppress heave-off
    if (result.type === 'executed' && dComp.overheadEntityId !== null) {
      return { type: 'executed', suppressHeaveOff: true };
    }
    return result;
  }

  // Ctrl+Down: heave block below
  return heaveDown(game, dir, pos);
}

function heaveOffOverhead(game: Game, pos: PositionComponent, _dComp: DwarfComponent): CtrlResult {
  const overheadY = pos.y - 1;
  const leftOk = canDisplaceTo(game, pos.x - 1, overheadY);
  const rightOk = canDisplaceTo(game, pos.x + 1, overheadY);
  if (leftOk && rightOk) {
    return { type: 'pendingHeave', data: { verticalDir: Direction.Up, blockX: pos.x, blockY: overheadY, leftAvailable: true, rightAvailable: true } };
  } else if (leftOk) {
    game.execute(new HoistCommand(Direction.Left));
  } else if (rightOk) {
    game.execute(new HoistCommand(Direction.Right));
  } else {
    game.log.add('action', 'No room to heave overhead block.');
  }
  return { type: 'executed' };
}

function hoistOrHeaveUp(game: Game, dir: Direction, pos: PositionComponent, dComp: DwarfComponent): CtrlResult {
  const candidate = findHoistableBlock(game, pos.x, pos.y, dComp.facingDirection);
  if (candidate === 'both') {
    return { type: 'pendingHoist', data: { leftAvailable: true, rightAvailable: true } };
  }
  if (candidate !== null) {
    game.execute(new HoistCommand(candidate.side));
    return { type: 'executed' };
  }
  // No hoistable block — check for block above to adopt as overhead
  const blockY = pos.y - 1;
  const block = findMovableAt(game, pos.x, blockY);
  if (block) {
    game.execute(new HoistCommand());
  } else {
    game.execute(new MoveCommand(dir));
  }
  return { type: 'executed' };
}

function heaveDown(game: Game, dir: Direction, pos: PositionComponent): CtrlResult {
  const vDir = dir as Direction.Up | Direction.Down;
  const blockY = pos.y + 1;
  const block = findMovableAt(game, pos.x, blockY);
  if (block) {
    const leftOk = canDisplaceTo(game, pos.x - 1, blockY);
    const rightOk = canDisplaceTo(game, pos.x + 1, blockY);
    if (game.hasPlatform({ x: pos.x, y: blockY + 1 })) {
      game.execute(new HeaveCommand(vDir, Direction.Left));
    } else if (leftOk && rightOk) {
      return { type: 'pendingHeave', data: { verticalDir: vDir, blockX: pos.x, blockY, leftAvailable: true, rightAvailable: true } };
    } else if (leftOk) {
      game.execute(new HeaveCommand(vDir, Direction.Left));
    } else if (rightOk) {
      game.execute(new HeaveCommand(vDir, Direction.Right));
    } else {
      game.log.add('action', 'Blocked on both sides.');
    }
  } else {
    const d = DirectionVec[dir];
    const hasCreature = game.world.query('position', 'creature').some((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === pos.x + d.x && p.y === pos.y + d.y;
    });
    if (hasCreature) {
      game.execute(new AttackCommand(dir));
    } else {
      game.execute(new MoveCommand(dir));
    }
  }
  return { type: 'executed' };
}
