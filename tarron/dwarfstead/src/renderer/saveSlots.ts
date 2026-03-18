import type { SaveData } from '../sim/save';

const SLOTS_KEY = 'dwarfstead-slots';
const SLOT_PREFIX = 'dwarfstead-slot-';
const ACTIVE_SLOT_KEY = 'dwarfstead-active-slot';
const OLD_SAVE_KEY = 'dwarfstead-save';

export const MAX_SLOTS = 5;

export interface SlotMeta {
  id: string;
  name: string;
  turn: number;
  timestamp: number;
  zoom?: number;
  mapOpen?: boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function readSlotsMeta(): SlotMeta[] {
  const raw = localStorage.getItem(SLOTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function writeSlotsMeta(slots: SlotMeta[]): void {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

/** Migrate old single-save format to slot 0 on first load. */
export function migrateOldSave(): void {
  const old = localStorage.getItem(OLD_SAVE_KEY);
  if (!old) return;
  const existing = readSlotsMeta();
  if (existing.length > 0) {
    // Already have slots — just remove old key
    localStorage.removeItem(OLD_SAVE_KEY);
    return;
  }
  try {
    const data: SaveData = JSON.parse(old);
    const id = 'migrated-0';
    localStorage.setItem(SLOT_PREFIX + id, old);
    const meta: SlotMeta = {
      id,
      name: 'Expedition',
      turn: data.tick ?? 0,
      timestamp: Date.now(),
    };
    writeSlotsMeta([meta]);
    setActiveSlot(id);
    localStorage.removeItem(OLD_SAVE_KEY);
  } catch {
    localStorage.removeItem(OLD_SAVE_KEY);
  }
}

export function listSlots(): SlotMeta[] {
  return readSlotsMeta();
}

export function loadSlot(id: string): SaveData | null {
  const raw = localStorage.getItem(SLOT_PREFIX + id);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveToSlot(id: string, data: SaveData, name: string): void {
  localStorage.setItem(SLOT_PREFIX + id, JSON.stringify(data));
  const slots = readSlotsMeta();
  const idx = slots.findIndex((s) => s.id === id);
  const prev = idx >= 0 ? slots[idx] : undefined;
  const meta: SlotMeta = { id, name, turn: data.tick, timestamp: Date.now(), zoom: prev?.zoom, mapOpen: prev?.mapOpen };
  if (idx >= 0) {
    slots[idx] = meta;
  } else {
    slots.push(meta);
  }
  writeSlotsMeta(slots);
}

export function deleteSlot(id: string): void {
  localStorage.removeItem(SLOT_PREFIX + id);
  const slots = readSlotsMeta().filter((s) => s.id !== id);
  writeSlotsMeta(slots);
  if (getActiveSlot() === id) {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  }
}

export function createSlot(name: string): string {
  const id = generateId();
  const slots = readSlotsMeta();
  slots.push({ id, name, turn: 0, timestamp: Date.now() });
  writeSlotsMeta(slots);
  return id;
}

export function getSlotMeta(id: string): SlotMeta | null {
  return readSlotsMeta().find((s) => s.id === id) ?? null;
}

export function updateSlotZoom(id: string, zoom: number): void {
  const slots = readSlotsMeta();
  const slot = slots.find((s) => s.id === id);
  if (slot) { slot.zoom = zoom; writeSlotsMeta(slots); }
}

export function updateSlotMapOpen(id: string, open: boolean): void {
  const slots = readSlotsMeta();
  const slot = slots.find((s) => s.id === id);
  if (slot) { slot.mapOpen = open; writeSlotsMeta(slots); }
}

export function getActiveSlot(): string | null {
  return localStorage.getItem(ACTIVE_SLOT_KEY);
}

export function setActiveSlot(id: string): void {
  localStorage.setItem(ACTIVE_SLOT_KEY, id);
}

export function clearActiveSlot(): void {
  localStorage.removeItem(ACTIVE_SLOT_KEY);
}
