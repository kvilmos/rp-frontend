import { BoxGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { Furniture } from '../furniture/furniture';
import { BlueprintScene } from './blueprint_scene';
import { Item } from './item';

export class PlaceholderItem extends Item {
  constructor(scene: BlueprintScene, position: Vector3) {
    const geometry = new BoxGeometry(100, 100, 100);
    const material = new MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
    });
    const mesh = new Mesh(geometry, material);

    const placeholderFurniture: Furniture = {
      id: 0,
      name: 'Placeholder',
      objectUrl: '',
      thumbnailUrl: '',
      categoryId: 0,
      createdAt: '',
    };

    super(scene, placeholderFurniture, mesh, position, 0, new Vector3(1, 1, 1));
  }

  public setError(): void {
    this.traverse((child) => {
      if (child instanceof Mesh && child.material instanceof MeshBasicMaterial) {
        child.material.color.set(0xff0000);
      }
    });
  }
}
