import type { Game } from '../../sim/Game';
import { Direction, BlockMaterial } from '../../sim/types';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { NoclipMoveCommand } from '../../sim/commands/NoclipMoveCommand';

/** Find the first air tile above solid ground, scanning downward from startY. */
function findLandingY(game: Game, x: number, startY: number): number {
  const h = game.terrain.height;
  for (let y = startY; y < h; y++) {
    if (game.getBlock({ x, y }) === BlockMaterial.Air) {
      if (y + 1 >= h || game.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
        return y;
      }
    }
  }
  return Math.max(0, h - 1);
}

/** Toggle noclip ghost mode on/off. */
export function toggleNoclip(game: Game): void {
  const dwarf = game.getMainDwarf();
  if (!dwarf) return;
  const dComp = dwarf.get<DwarfComponent>('dwarf')!;
  const pos = dwarf.get<PositionComponent>('position')!;

  if (dComp.isGhost) {
    // Exit noclip: land on nearest solid surface below
    dComp.isGhost = false;
    game.noclipMode = false;
    pos.y = findLandingY(game, pos.x, pos.y);
    game.log.add('system', `${dComp.name} phases back to solid ground.`);
  } else {
    dComp.isGhost = true;
    game.noclipMode = true;
    game.log.add('system', `${dComp.name} enters ghost mode.`);
  }
}

/** Move the ghost dwarf in a direction. Ticks the simulation. */
export function handleNoclipMove(game: Game, dir: Direction): void {
  game.execute(new NoclipMoveCommand(dir));
}

/** Check if noclip is currently active. */
export function isNoclipActive(game: Game): boolean {
  const dwarf = game.getMainDwarf();
  if (!dwarf) return false;
  return dwarf.get<DwarfComponent>('dwarf')!.isGhost;
}
