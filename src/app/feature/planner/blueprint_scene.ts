import { Injectable } from '@angular/core';
import { Scene } from 'three';

@Injectable({
  providedIn: 'root',
})
export class BlueprintScene {
  private scene: Scene;
  private item = [];
  public needsUpdate = false;

  constructor() {
    this.scene = new Scene();
  }

  public getScene(): Scene {
    return this.scene;
  }

  public add(mesh: any) {
    this.scene.add(mesh);
  }

  public remove(mesh: any) {
    this.scene.remove(mesh);
  }
}
