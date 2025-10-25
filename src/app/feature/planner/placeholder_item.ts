import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { Furniture } from '../furniture/furniture';
import { BlueprintScene } from './blueprint_scene';
import { Item } from './item';

export class PlaceholderItem extends Item {
  constructor(
    scene: BlueprintScene,
    furniture: Furniture,
    object: Object3D,
    position: Vector3,
    rotation: number,
    scale: Vector3
  ) {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
    });
    object = new Mesh(geometry, material);

    super(scene, furniture, object, position, rotation, scale);
  }

  public setError(): void {
    this.traverse((child) => {
      if (child instanceof Mesh && child.material instanceof MeshBasicMaterial) {
        child.material.color.set(0xff0000);
      }
    });
  }
}
