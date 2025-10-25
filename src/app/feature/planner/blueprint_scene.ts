import { inject, Injectable } from '@angular/core';
import { Object3D, Scene, Vector3 } from 'three';
import { AssetManager } from './asset_manager';
import { Furniture } from '../furniture/furniture';
import { Item } from './item';
import { ItemFactory, ItemType } from './factory';
import { InteractionService } from './interaction_service';
import { Blueprint } from './blueprint';
import { CompleteBlueprint } from './blueprint_load';

@Injectable({
  providedIn: 'root',
})
export class BlueprintScene {
  private scene: Scene;
  private items: Item[] = [];

  private readonly assetManager = inject(AssetManager);
  private readonly interactionService = inject(InteractionService);
  private readonly bp = inject(Blueprint);
  constructor() {
    this.scene = new Scene();
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
    rotY: number,
    scale: Vector3
  ): Promise<Item> {
    const ItemClass = ItemFactory.getClass(ItemType.PlaceholderItem);
    if (!ItemClass) {
      throw console.error(`addItem: invalid itemType: ${itemType}`);
    }
    const placeholder = new ItemClass(this, furniture, Object3D, position, rotY, scale, this.bp);
    this.items.push(placeholder);
    this.add(placeholder);

    try {
      const loadedModel = await this.assetManager.getModel(furniture);
      const ItemClass = ItemFactory.getClass(itemType);
      if (!ItemClass) {
        throw console.error(`addItem: invalid itemType: ${itemType}`);
      }

      const item = new ItemClass(
        this,
        furniture,
        loadedModel,
        placeholder.position,
        placeholder.rotation.y,
        scale,
        this.bp
      );
      this.items.push(item);
      this.add(item);
      this.interactionService.newItemCreated$.next(item);

      this.removeItem(placeholder);
      return item;
    } catch (error) {
      this.removeItem(placeholder);
      throw console.error(error);
    }
  }

  public async loadItems(blueprint: CompleteBlueprint): Promise<void> {
    if (!blueprint.items || blueprint.items.length === 0) {
      return;
    }

    const furnitureMap = new Map<number, Furniture>();
    const furnitureList = blueprint.furniture;
    if (furnitureList && furnitureList.length) {
      for (let i = 0; i < furnitureList.length; i++) {
        furnitureMap.set(furnitureList[i].id, furnitureList[i]);
      }
    }

    const itemPromises = blueprint.items.map((itemData) => {
      const furniture = furnitureMap.get(itemData.furnitureId);
      if (!furniture) {
        console.error(`loadItems: furniture missing:${itemData.furnitureId}`);
        return Promise.resolve();
      }
      const position = new Vector3(itemData.posX, itemData.posY, itemData.posZ);
      return this.addItem(3, furniture, position, itemData.rot, new Vector3(100, 100, 100));
    });

    await Promise.all(itemPromises);
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

  public clear(): void {
    while (this.items.length > 0) {
      this.removeItem(this.items[0]);
    }
    this.items = [];
    this.scene.clear();
  }
}
