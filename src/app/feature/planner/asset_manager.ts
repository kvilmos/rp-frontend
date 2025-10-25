import { Injectable } from '@angular/core';
import { Group, Mesh } from 'three';
import { Furniture } from '../furniture/furniture';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

@Injectable({
  providedIn: 'root',
})
export class AssetManager {
  private readonly loader = new GLTFLoader();
  private readonly modelCache = new Map<number, Group>();
  constructor() {}

  public async getModel(furniture: Furniture): Promise<Group> {
    if (this.modelCache.has(furniture.id)) {
      const cachedModel = this.modelCache.get(furniture.id)!;
      return cachedModel.clone(true);
    }

    try {
      const gltf = await this.loader.loadAsync(furniture.objectUrl);
      const model = gltf.scene;

      model.traverse((child) => {
        if ((child as Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.modelCache.set(furniture.id, model);

      return model.clone(true);
    } catch (error) {
      console.error(`Failed to load model: "${furniture.id}"`, error);

      throw new Error(`Loading model failed ${furniture.id}`);
    }
  }
}
