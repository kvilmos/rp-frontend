import { generateUUID } from 'three/src/math/MathUtils.js';
import { Blueprint } from './blueprint';

export class Corner {
  public id: string;
  public x: number;
  public y: number;

  private blueprint: Blueprint;

  constructor(blueprint: Blueprint, x: number, y: number, id?: string) {
    this.blueprint = blueprint;
    this.x = x;
    this.y = y;
    this.id = id || generateUUID();
  }
}
