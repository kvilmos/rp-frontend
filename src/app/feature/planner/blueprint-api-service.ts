import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Blueprint } from './blueprint';
import { BlueprintScene } from './blueprint_scene';
import { CornerSave, WallSave, ItemSave, BlueprintSave } from './save_blueprint';

@Injectable({
  providedIn: 'root',
})
export class BlueprintApiService {
  private readonly blueprint = inject(Blueprint);
  private readonly bpScene = inject(BlueprintScene);
  private readonly http = inject(HttpClient);
  constructor() {}

  public InitBlueprint(): void {
    this.createBlueprint().subscribe({
      next: (data) => {
        if (data && data.id) {
          this.blueprint.id = data.id;
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  public createBlueprint(): Observable<any> {
    return this.http.post('/api/blueprint', null);
  }

  public saveBlueprint(): void {
    const corner = this.blueprint.getCorners();
    const walls = this.blueprint.getWalls();
    const items = this.bpScene.getItems();

    const saveCorners: CornerSave[] = [];
    for (let i = 0; i < corner.length; i++) {
      const addCorner: CornerSave = {
        id: corner[i].id,
        x: corner[i].x,
        y: corner[i].y,
      };
      saveCorners.push(addCorner);
    }

    const saveWalls: WallSave[] = [];
    for (let i = 0; i < walls.length; i++) {
      const addWall: WallSave = {
        startCornerId: walls[i].getStartId(),
        endCornerId: walls[i].getEndId(),
      };
      saveWalls.push(addWall);
    }

    const saveItems: ItemSave[] = [];
    for (let i = 0; i < items.length; i++) {
      const addItem: ItemSave = {
        furnitureId: items[i].furniture.id,
        posX: items[i].position.x,
        posY: items[i].position.y,
        posZ: items[i].position.z,
        rot: items[i].position.y,
      };
      saveItems.push(addItem);
    }

    const saveBp: BlueprintSave = {
      id: this.blueprint.id,
      corners: saveCorners,
      walls: saveWalls,
      items: saveItems,
    };

    this.uploadBlueprint(saveBp).subscribe({
      next: (data) => {
        console.log(data);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  public uploadBlueprint(blueprint: BlueprintSave): Observable<any> {
    return this.http.put(`/api/blueprint/${this.blueprint.id}`, blueprint);
  }
}
