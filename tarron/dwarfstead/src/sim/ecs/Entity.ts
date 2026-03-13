import type { Component } from './Component';

let nextId = 1;

export class Entity {
  readonly id: number;
  private components = new Map<string, Component>();

  constructor(id?: number) {
    if (id !== undefined) {
      this.id = id;
    } else {
      this.id = nextId++;
    }
  }

  add<T extends Component>(component: T): this {
    this.components.set(component.kind, component);
    return this;
  }

  get<T extends Component>(kind: string): T | undefined {
    return this.components.get(kind) as T | undefined;
  }

  has(kind: string): boolean {
    return this.components.has(kind);
  }

  remove(kind: string): boolean {
    return this.components.delete(kind);
  }

  kinds(): string[] {
    return [...this.components.keys()];
  }
}

/** Reset entity ID counter (for tests). */
export function resetEntityIds(): void {
  nextId = 1;
}

/** Set the next entity ID (for save/load). */
export function setNextEntityId(n: number): void {
  nextId = n;
}
