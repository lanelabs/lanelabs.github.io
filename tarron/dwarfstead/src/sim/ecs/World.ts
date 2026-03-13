import { Entity } from './Entity';

export class World {
  private entities = new Map<number, Entity>();

  spawn(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  despawn(id: number): boolean {
    return this.entities.delete(id);
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  /** Return all entities that have every one of the given component kinds. */
  query(...kinds: string[]): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (kinds.every((k) => entity.has(k))) {
        results.push(entity);
      }
    }
    return results;
  }

  /** Return all entities in the world. */
  all(): Entity[] {
    return [...this.entities.values()];
  }

  /** Insert a pre-built entity (for deserialization). */
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  get size(): number {
    return this.entities.size;
  }
}
