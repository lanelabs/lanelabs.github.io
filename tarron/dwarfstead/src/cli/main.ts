import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Game } from '../sim/Game';
import { parseInput, HELP_TEXT } from './commands';
import { renderTerrain, renderLog, renderStatus, renderInspect } from './renderer';
import { serializeGame } from '../sim/save';
import type { SaveData } from '../sim/save';

const DEFAULT_CONFIG = {
  seed: 42,
  worldWidth: 200,
  worldHeight: 400,
  startingDwarves: 3,
  seasonLength: 50,
};

const SAVE_PATH = path.join(os.homedir(), '.dwarfstead-save.json');

function saveGame(game: Game): void {
  const data = serializeGame(game);
  fs.writeFileSync(SAVE_PATH, JSON.stringify(data));
}

function loadGame(): Game | null {
  try {
    const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
    const data: SaveData = JSON.parse(raw);
    return Game.fromSaveData(data);
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const seedArg = args.find((a: string) => a.startsWith('--seed='));
  const config = {
    ...DEFAULT_CONFIG,
    ...(seedArg ? { seed: parseInt(seedArg.split('=')[1], 10) } : {}),
  };

  let game = new Game(config);
  game.init();

  console.log('\n  === DWARFSTEAD ===');
  console.log('  Dig deep. Build well. Honor the mountain.\n');
  console.log(renderStatus(game));
  console.log();
  console.log(renderTerrain(game));
  console.log();
  console.log("  Type 'help' for commands.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'dwarfstead> ',
  });

  rl.prompt();

  rl.on('line', (line: string) => {
    const input = parseInput(line);

    switch (input.type) {
      case 'command': {
        const result = game.execute(input.command);
        console.log(`  ${result.message}`);
        if (game.expeditionOver) {
          console.log('\n  The expedition is over. Type "quit" to exit.\n');
        }
        break;
      }

      case 'look':
        console.log(renderTerrain(game));
        break;

      case 'status':
        console.log(renderStatus(game));
        break;

      case 'log':
        console.log(renderLog(game, input.count, input.category));
        break;

      case 'inspect':
        console.log(renderInspect(game, input.dx, input.dy));
        break;

      case 'help':
        console.log(HELP_TEXT);
        break;

      case 'quit':
        console.log('  Farewell, mountaineer.');
        rl.close();
        process.exit(0);
        break;

      case 'save':
        saveGame(game);
        console.log(`  Game saved to ${SAVE_PATH}`);
        break;

      case 'load': {
        const loaded = loadGame();
        if (loaded) {
          game = loaded;
          console.log('  Game loaded.');
          console.log(renderStatus(game));
        } else {
          console.log('  No save file found.');
        }
        break;
      }

      case 'error':
        console.log(`  ${input.message}`);
        break;
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main();
