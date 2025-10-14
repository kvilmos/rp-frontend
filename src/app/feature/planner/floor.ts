import {
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  Shape,
  ShapeGeometry,
  TextureLoader,
  Vector2,
} from 'three';
import { BlueprintScene } from './blueprint_scene';
import { Room } from './Room';

export class Floor {
  private scene: BlueprintScene;
  private room: Room;
  private floorMesh: Mesh;
  private textureLoader = new TextureLoader();

  constructor(scene: BlueprintScene, room: Room) {
    this.scene = scene;
    this.room = room;

    // missing event handler: onFloorChange event calls the redraw function. It is probably not finished in the master code.

    this.floorMesh = this.buildFloor();
  }

  private redraw(): void {
    this.removeFromScene();
    this.floorMesh = this.buildFloor();
    this.addToScene();
  }

  private buildFloor(): Mesh {
    const textureSettings = this.room.getTexture();
    this.textureLoader.load('');
    //var floorTexture = ImageUtils.loadTexture(textureSettings.url);

    const floorMaterialTop = new MeshPhongMaterial({
      side: DoubleSide,
      color: 0xcccccc,
      specular: 0x0a0a0a,
    });

    var textureScale = 400; // textureSettings.scale;
    // TODO: TEXTURE Setting

    const points = [];
    for (let i = 0; i < this.room.interiorCorners.length; i++) {
      const corner = this.room.interiorCorners[i];
      points.push(new Vector2(corner.x / textureScale, corner.y / textureScale));
    }

    const shape = new Shape(points);
    const geometry = new ShapeGeometry(shape);
    const floor = new Mesh(geometry, floorMaterialTop);

    floor.rotation.set(Math.PI / 2, 0, 0);
    floor.scale.set(textureScale, textureScale, textureScale);
    floor.receiveShadow = true;

    return floor;
  }

  public addToScene() {
    this.scene.add(this.floorMesh);
    this.scene.add(this.room.floorMesh!);
  }

  public removeFromScene() {
    this.scene.remove(this.floorMesh);
    this.scene.remove(this.room.floorMesh!);
  }
}
