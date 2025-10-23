import { inject, Injectable } from '@angular/core';
import { Object3D, Scene, Vector3 } from 'three';
import { AssetManager } from './asset_manager';
import { Furniture } from '../furniture/furniture';
import { Item } from './item';
import { Factory, ItemType } from './factory';
import { InteractionService } from './interaction_service';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Blueprint } from './blueprint';

@Injectable({
  providedIn: 'root',
})
export class BlueprintScene {
  private scene: Scene;
  private items: Item[] = [];

  private assetManager: AssetManager;
  private loader: GLTFLoader;

  public needsUpdate = false;
  private readonly interactionService = inject(InteractionService);
  private readonly bp = inject(Blueprint);

  constructor() {
    this.scene = new Scene();
    this.loader = new GLTFLoader();
    this.assetManager = new AssetManager();
  }

  public getScene(): Scene {
    return this.scene;
  }

  public add(mesh: Object3D) {
    this.scene.add(mesh);
  }

  public remove(mesh: Object3D) {
    this.scene.remove(mesh);
  }

  public getItems(): Item[] {
    return this.items;
  }

  public async addItem(
    itemType: ItemType,
    furniture: Furniture,
    position: Vector3,
    rotationY: number,
    scale: Vector3
  ): Promise<Item> {
    try {
      const loadedModel = await this.assetManager.getModel(furniture);

      const ItemClass = Factory.getClass(itemType);
      if (!ItemClass) {
        throw new Error(`addItem: invalid itemType: ${itemType}`);
      }
      const item = new ItemClass(this, furniture, loadedModel, position, rotationY, scale, this.bp);
      this.items.push(item);
      this.add(item);
      this.interactionService.newItemCreated$.next(item); // new
      console.log(`addItem: Item ( ${ItemType[itemType]}) created successfully.`);

      return item;
    } catch (error) {
      console.error('addItem: Adding item failed:', error);
      throw error;
    }
  }

  public removeItem(itemToRemove: Item): void {
    this.scene.remove(itemToRemove);

    const index = this.items.indexOf(itemToRemove);
    if (index > -1) {
      this.items.splice(index, 1);
    }

    itemToRemove.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.isMaterial) {
          child.material.dispose();
        }
      }
    });
  }
}
