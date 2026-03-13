import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { BlockTypeComponent } from '../components/BlockType';

export class ReturnCommand implements Command {
  readonly name = 'return';

  execute(game: Game): CommandResult {
    const surfaceY = game.surfaceY;

    // Count all block entities at or above the surface
    const surfaceBlocks = game.world.query('position', 'blockType').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.y <= surfaceY;
    });

    const haul = new Map<string, number>();
    for (const e of surfaceBlocks) {
      const bt = e.get<BlockTypeComponent>('blockType')!;
      haul.set(bt.material, (haul.get(bt.material) || 0) + 1);
    }

    const totalBlocks = surfaceBlocks.length;
    game.expeditionOver = true;

    let summary = `Expedition complete after ${game.getCurrentTick()} ticks.`;
    if (totalBlocks === 0) {
      summary += ' You return empty-handed.';
      game.log.add('system', 'The expedition ends. Nothing to show for it.');
    } else {
      const items = [...haul.entries()].map(([m, c]) => `${c} ${m}`).join(', ');
      summary += ` Hauled home: ${items}.`;
      game.log.add('system', `The expedition ends. The mountain home receives: ${items}.`);
    }

    game.log.add('narration', 'The dwarves march home, weary but proud.');
    return { success: true, message: summary };
  }
}
