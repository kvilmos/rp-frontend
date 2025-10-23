import { Object3D, Vector3 } from 'three';
import { BlueprintScene } from './blueprint_scene';
import { FloorItem } from './floor_item';
import { Furniture } from '../furniture/furniture';

export class OnFloorItem extends FloorItem {
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
