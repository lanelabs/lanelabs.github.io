import { Direction } from '../sim/types';
import type { Command } from '../sim/commands/Command';
import { MoveCommand } from '../sim/commands/MoveCommand';
import { DigCommand } from '../sim/commands/DigCommand';
import { PushCommand } from '../sim/commands/PushCommand';
import { CarryCommand } from '../sim/commands/CarryCommand';
import { DropCommand } from '../sim/commands/DropCommand';
import { BuildLadderCommand } from '../sim/commands/BuildLadderCommand';
import { AttackCommand } from '../sim/commands/AttackCommand';
import { DispatchCommand } from '../sim/commands/DispatchCommand';
import { ReturnCommand } from '../sim/commands/ReturnCommand';
import { WaitCommand } from '../sim/commands/WaitCommand';
import { TetherCommand } from '../sim/commands/TetherCommand';
import { DismantleLadderCommand } from '../sim/commands/DismantleLadderCommand';
import { ShoveCommand } from '../sim/commands/ShoveCommand';
import { HeaveCommand } from '../sim/commands/HeaveCommand';
import { HoistCommand } from '../sim/commands/HoistCommand';
import { CementCommand } from '../sim/commands/CementCommand';
import { SellBlockCommand } from '../sim/commands/SellBlockCommand';
import { CollectCrateCommand } from '../sim/commands/CollectCrateCommand';
import { ShapedChargeCommand } from '../sim/commands/ShapedChargeCommand';
import { ChipCommand } from '../sim/commands/ChipCommand';

const DIRECTION_ALIASES: Record<string, Direction> = {
  up: Direction.Up,
  u: Direction.Up,
  down: Direction.Down,
  d: Direction.Down,
  left: Direction.Left,
  l: Direction.Left,
  right: Direction.Right,
  r: Direction.Right,
};

export type ParsedInput =
  | { type: 'command'; command: Command }
  | { type: 'look' }
  | { type: 'status' }
  | { type: 'log'; count: number; category?: string }
  | { type: 'inspect'; dx: number; dy: number }
  | { type: 'save' }
  | { type: 'load' }
  | { type: 'help' }
  | { type: 'wdebug' }
  | { type: 'quit' }
  | { type: 'error'; message: string };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  if (!cmd) return { type: 'error', message: 'Empty command.' };

  switch (cmd) {
    case 'move':
    case 'm': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: move <up|down|left|right>' };
      return { type: 'command', command: new MoveCommand(dir) };
    }

    case 'dig': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: dig <up|down|left|right>' };
      return { type: 'command', command: new DigCommand(dir) };
    }

    case 'push': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: push <up|down|left|right>' };
      return { type: 'command', command: new PushCommand(dir) };
    }

    case 'shove': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: shove <left|right>' };
      return { type: 'command', command: new ShoveCommand(dir) };
    }

    case 'heave': {
      const vDir = DIRECTION_ALIASES[parts[1]];
      const lDir = DIRECTION_ALIASES[parts[2]];
      if (vDir !== Direction.Up && vDir !== Direction.Down) {
        return { type: 'error', message: 'Usage: heave <up|down> <left|right>' };
      }
      if (lDir !== Direction.Left && lDir !== Direction.Right) {
        return { type: 'error', message: 'Usage: heave <up|down> <left|right>' };
      }
      return { type: 'command', command: new HeaveCommand(vDir, lDir) };
    }

    case 'hoist': {
      const dirArg = DIRECTION_ALIASES[parts[1]];
      const side = dirArg === Direction.Left ? Direction.Left
        : dirArg === Direction.Right ? Direction.Right : undefined;
      return { type: 'command', command: new HoistCommand(side) };
    }

    case 'cement':
      return { type: 'command', command: new CementCommand() };

    case 'carry':
    case 'pickup':
      return { type: 'command', command: new CarryCommand() };

    case 'drop':
      return { type: 'command', command: new DropCommand() };

    case 'build': {
      if (parts[1] === 'ladder') {
        const dir = DIRECTION_ALIASES[parts[2]];
        if (!dir) return { type: 'error', message: 'Usage: build ladder <up|down|left|right>' };
        return { type: 'command', command: new BuildLadderCommand(dir) };
      }
      return { type: 'error', message: 'Usage: build ladder <direction>' };
    }

    case 'attack': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: attack <up|down|left|right>' };
      return { type: 'command', command: new AttackCommand(dir) };
    }

    case 'dispatch': {
      const name = parts[1];
      if (!name) return { type: 'error', message: 'Usage: dispatch <name> haul' };
      return { type: 'command', command: new DispatchCommand(name, 'haul') };
    }

    case 'return':
    case 'retreat':
      return { type: 'command', command: new ReturnCommand() };

    case 'tether':
    case 'lasso':
    case 'untether':
      return { type: 'command', command: new TetherCommand() };

    case 'dismantle':
    case 'remove':
      return { type: 'command', command: new DismantleLadderCommand() };

    case 'sell':
      return { type: 'command', command: new SellBlockCommand() };

    case 'collect':
      return { type: 'command', command: new CollectCrateCommand() };

    case 'shaped-charge': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: shaped-charge <up|down|left|right>' };
      return { type: 'command', command: new ShapedChargeCommand(dir) };
    }

    case 'chip': {
      const dir = DIRECTION_ALIASES[parts[1]];
      if (!dir) return { type: 'error', message: 'Usage: chip <up|down|left|right>' };
      return { type: 'command', command: new ChipCommand(dir) };
    }

    case 'wait':
    case 'tick':
    case 'w':
    case 't':
      return { type: 'command', command: new WaitCommand() };

    case 'look':
    case 'map':
      return { type: 'look' };

    case 'status':
    case 'st':
      return { type: 'status' };

    case 'log': {
      const count = parts[1] ? parseInt(parts[1], 10) : 10;
      const category = parts[2];
      return { type: 'log', count: isNaN(count) ? 10 : count, category };
    }

    case 'inspect':
    case 'i': {
      const dirStr = parts[1];
      if (!dirStr) return { type: 'inspect', dx: 0, dy: 0 };
      const dir = DIRECTION_ALIASES[dirStr];
      if (!dir) return { type: 'error', message: 'Usage: inspect [up|down|left|right]' };
      const vec = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };
      const d = vec[dir];
      return { type: 'inspect', dx: d.dx, dy: d.dy };
    }

    case 'wdebug':
      return { type: 'wdebug' };

    case 'save':
      return { type: 'save' };

    case 'load':
      return { type: 'load' };

    case 'help':
    case 'h':
    case '?':
      return { type: 'help' };

    case 'quit':
    case 'exit':
    case 'q':
      return { type: 'quit' };

    default:
      return { type: 'error', message: `Unknown command: ${cmd}. Type 'help' for commands.` };
  }
}

export const HELP_TEXT = `
  Dwarfstead CLI — Commands:

  Movement & Digging:
    move <dir>          Move main dwarf (up/down/left/right, or u/d/l/r)
    dig <dir>           Dig in a direction

  Material Handling:
    push <dir>          Push a block in a direction
    shove <left|right>  Move + push/pull an adjacent block
    heave <up|down> <l|r>  Heave block above/below to the side
    hoist [left|right]  Hoist block overhead / heave off overhead block
    carry               Pick up a light item at your feet
    drop                Drop carried item
    tether / lasso      Lasso or untie facing block (rope tool)
    cement              Cement facing loose block into terrain
    shaped-charge <dir> Destroy a block with a shaped charge (1 supply)
    chip <dir>          Begin chipping away at a block (free, slow)

  Building:
    build ladder <dir>  Build ladder (up/down) or platform (left/right)
    dismantle / remove  Dismantle facing ladder/platform (recover 1 supply)

  Combat:
    attack <dir>        Attack a creature in a direction

  Companions:
    dispatch <name> haul  Send a companion to haul the nearest block to surface
    sell                  Sell a completed shaped block (facing direction)
    collect               Collect a supply crate (facing direction)

  Expedition:
    wait / tick         Advance one tick
    return              End the expedition and tally your haul
    save                Save game to disk
    load                Load saved game from disk

  Info:
    look / map          Show ASCII terrain map
    status              Show dwarf stats, materials, season info
    inspect [dir]       Inspect block at position
    log [n] [cat]       Show last n log entries (filter by category)
    help                Show this help
    quit                Exit
`.trimStart();
