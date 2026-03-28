import { SimulationBridge } from '../bridge';
import { serializeGame } from '../../sim/save';
import type { Game } from '../../sim/Game';
import { saveToSlot, setActiveSlot, loadSlot } from '../saveSlots';
import { buildWaterTestTerrain } from '../../sim/terrain/waterTestTerrain';

const MODE_KEY = 'dwarfstead-mode';

export function createFreshBridge(_gameW: number, _gameH: number, _zoomTileSize: number): SimulationBridge {
  const bridge = new SimulationBridge({
    seed: Date.now(), worldWidth: 200,
    worldHeight: 400, startingDwarves: 3,
  });
  bridge.init(); return bridge;
}

export function createWaterTestBridge(): SimulationBridge {
  const terrain = buildWaterTestTerrain();
  const bridge = new SimulationBridge({
    seed: Date.now(),
    worldWidth: terrain.width,
    worldHeight: terrain.height,
    startingDwarves: 1,
    seasonLength: 99999, // long dry season — no edge water injection
    terrainOverride: terrain,
  });
  bridge.init();
  return bridge;
}

export function initBridge(
  waterTest: boolean, slotId: string | null, makeFresh: () => SimulationBridge,
): SimulationBridge {
  if (waterTest) return createWaterTestBridge();
  const saveData = slotId ? loadSlot(slotId) : null;
  if (!saveData) return makeFresh();
  try {
    const b = SimulationBridge.fromSaveData(saveData);
    b.game.log.markSessionStart();
    b.game.log.add('narration', 'You awaken from a brief rest. The mountain still calls.');
    return b;
  } catch { return makeFresh(); }
}

export function autoSave(
  game: Game, slotId: string | null, slotName: string, currentMode: number,
): void {
  try {
    if (!slotId) return;
    const data = serializeGame(game);
    saveToSlot(slotId, data, slotName);
    setActiveSlot(slotId);
    localStorage.setItem(MODE_KEY, String(currentMode));
  } catch { /* ignore */ }
}
