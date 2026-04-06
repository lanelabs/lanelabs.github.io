import { SimulationBridge } from '../bridge';
import { serializeGame } from '../../sim/save';
import type { SaveData } from '../../sim/save';
import type { Game } from '../../sim/Game';
import type { PipeCell, PumpCell, WaterSaveData } from '../../sim/water/types';
import type { GasSaveData } from '../../sim/gas/types';
import { WaterPathSystem } from '../../sim/water/WaterPathSystem';
import { GasPathSystem } from '../../sim/gas/GasPathSystem';
import { saveToSlot, setActiveSlot, loadSlot } from '../saveSlots';

const MODE_KEY = 'dwarfstead-mode';

export interface BridgeInit {
  bridge: SimulationBridge;
  waterSaveData?: WaterSaveData;
  gasSaveData?: GasSaveData;
}

export function createFreshBridge(_gameW: number, _gameH: number, _zoomTileSize: number): SimulationBridge {
  const bridge = new SimulationBridge({
    seed: Date.now(), worldWidth: 200,
    worldHeight: 400, startingDwarves: 3,
  });
  bridge.init(); return bridge;
}

export function initBridge(
  slotId: string | null, makeFresh: () => SimulationBridge,
): BridgeInit {
  const saveData: SaveData | null = slotId ? loadSlot(slotId) : null;
  if (!saveData) return { bridge: makeFresh() };
  try {
    const b = SimulationBridge.fromSaveData(saveData);
    b.game.log.markSessionStart();
    b.game.log.add('narration', 'You awaken from a brief rest. The mountain still calls.');
    return { bridge: b, waterSaveData: saveData.waterSaveData, gasSaveData: saveData.gasSaveData };
  } catch { return { bridge: makeFresh() }; }
}

export function autoSave(
  game: Game, waterData: WaterSaveData | undefined,
  slotId: string | null, slotName: string, currentMode: number,
  gasData?: GasSaveData,
): void {
  try {
    if (!slotId) return;
    const data = serializeGame(game, waterData, gasData);
    saveToSlot(slotId, data, slotName);
    setActiveSlot(slotId);
    localStorage.setItem(MODE_KEY, String(currentMode));
  } catch { /* ignore */ }
}

export function createFluidSystems(
  game: Game, waterSaved?: WaterSaveData, gasSaved?: GasSaveData,
): { water: WaterPathSystem; gas: GasPathSystem } {
  const t = game.terrain;
  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < t.height; y++) pipes.push(new Array(t.width).fill(null));
  const pumps: PumpCell[] = [];
  const water = new WaterPathSystem({
    width: t.width, height: t.height, blocks: t.blocks,
    pipes, pumps, initialWaterVolume: waterSaved ? [] : t.initialWaterVolume,
  });
  if (waterSaved) WaterPathSystem.restoreState(water, waterSaved);
  const gas = new GasPathSystem({
    width: t.width, height: t.height, blocks: t.blocks,
    pipes, pumps, initialGasVolume: gasSaved ? [] : t.initialGasVolume,
  });
  if (gasSaved) GasPathSystem.restoreState(gas, gasSaved);
  return { water, gas };
}
