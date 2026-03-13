import type { Component } from '../ecs/Component';

export class RubbleComponent implements Component {
  readonly kind = 'rubble';
}
