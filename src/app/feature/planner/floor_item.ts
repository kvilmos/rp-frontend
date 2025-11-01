import { Item } from './item';
import { BlueprintScene } from './blueprint_scene';
import { Furniture } from '../furniture/furniture';
import { Object3D, Vector3 } from 'three';

export class FloorItem extends Item {
  constructor(
    scene: BlueprintScene,
    furniture: Furniture,
    object: Object3D,
    position: Vector3,
    rotation: number,
    scale: Vector3
  ) {
    super(scene, furniture, object, position, rotation, scale);
  }
}
