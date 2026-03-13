export type LogCategory = 'action' | 'discovery' | 'combat' | 'system' | 'narration';

export interface LogEntry {
  tick: number;
  category: LogCategory;
  message: string;
  /** If set, this entry represents repeated messages from startTick..tick. */
  repeatCount?: number;
}

export class GameLog {
  private entries: LogEntry[] = [];
  private currentTick = 0;
  private _sessionStartIndex = 0;

  setTick(tick: number): void {
    this.currentTick = tick;
  }

  add(category: LogCategory, message: string): void {
    // Coalesce consecutive identical messages into a repeat count
    const last = this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
    if (last && last.category === category && last.message === message) {
      last.tick = this.currentTick;
      last.repeatCount = (last.repeatCount ?? 1) + 1;
      return;
    }
    this.entries.push({ tick: this.currentTick, category, message });
  }

  /** Get recent entries, optionally filtered by category. */
  recent(count: number, category?: LogCategory): LogEntry[] {
    const filtered = category
      ? this.entries.filter((e) => e.category === category)
      : this.entries;
    return filtered.slice(-count);
  }

  /** Get all entries. */
  all(): readonly LogEntry[] {
    return this.entries;
  }

  get length(): number {
    return this.entries.length;
  }

  /** Mark the start of this session (entries from here are included in copy). */
  markSessionStart(): void {
    this._sessionStartIndex = this.entries.length;
  }

  get sessionStartIndex(): number {
    return this._sessionStartIndex;
  }

  /** Restore entries and tick from a save. */
  restore(entries: LogEntry[], currentTick: number): void {
    this.entries = entries;
    this.currentTick = currentTick;
  }
}
