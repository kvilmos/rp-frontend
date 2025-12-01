import {
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from 'three';
import { BlueprintScene } from './blueprint_scene';
import { Room } from './room';

export class Floor {
  private scene: BlueprintScene;
  private room: Room;
  private floorMesh: Mesh;
  private textureLoader = new TextureLoader();

  constructor(scene: BlueprintScene, room: Room) {
    this.scene = scene;
    this.room = room;
    this.floorMesh = this.buildFloor();
  }

  private buildFloor(): Mesh {
    const texturePath = '/assets/images/textures/floor.jpg';
    const floorTexture = this.textureLoader.load(texturePath);
    const textureScale = 128;

    floorTexture.wrapS = RepeatWrapping;
    floorTexture.wrapT = RepeatWrapping;
    floorTexture.colorSpace = SRGBColorSpace;

    const floorMaterialTop = new MeshStandardMaterial({
      side: DoubleSide,
      map: floorTexture,
      roughness: 0.8,
      metalness: 0.2,
    });

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
    floor.castShadow = false;

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
