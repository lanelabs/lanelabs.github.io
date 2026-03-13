import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { BlockTypeComponent } from '../components/BlockType';

export class DispatchCommand implements Command {
  readonly name = 'dispatch';

  constructor(
    private companionName: string,
    private task: 'haul' = 'haul',
  ) {}

  execute(game: Game): CommandResult {
    // Find companion by name
    const companions = game.world.query('dwarf', 'position', 'companionTask');
    const companion = companions.find((e) => {
      const d = e.get<DwarfComponent>('dwarf')!;
      return d.name.toLowerCase() === this.companionName.toLowerCase() && !d.isMainDwarf;
    });

    if (!companion) {
      return { success: false, message: `No companion named "${this.companionName}" found.` };
    }

    const ct = companion.get<CompanionTaskComponent>('companionTask')!;
    if (ct.task !== 'idle') {
      return { success: false, message: `${this.companionName} is already busy (${ct.task}).` };
    }

    const companionPos = companion.get<PositionComponent>('position')!;

    // Find nearest block entity
    const blocks = game.world.query('position', 'blockType', 'movable');
    if (blocks.length === 0) {
      return { success: false, message: 'No loose blocks to haul.' };
    }

    let nearest = blocks[0];
    let nearestDist = Infinity;
    for (const b of blocks) {
      const bp = b.get<PositionComponent>('position')!;
      const dist = Math.abs(bp.x - companionPos.x) + Math.abs(bp.y - companionPos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = b;
      }
    }

    const bp = nearest.get<PositionComponent>('position')!;
    const bt = nearest.get<BlockTypeComponent>('blockType')!;

    // Set companion task — they'll work off-screen for N ticks based on distance to surface
    ct.task = 'haul';
    ct.targetEntityId = nearest.id;
    const distToSurface = Math.abs(bp.y - game.surfaceY) + Math.abs(bp.x - companionPos.x);
    ct.ticksRemaining = Math.max(3, distToSurface);

    const dwarfComp = companion.get<DwarfComponent>('dwarf')!;
    game.log.add('action', `${dwarfComp.name} sets off to haul ${bt.material} to the surface.`);
    return { success: true, message: `${dwarfComp.name} dispatched to haul ${bt.material} (ETA: ${ct.ticksRemaining} ticks).` };
  }
}
