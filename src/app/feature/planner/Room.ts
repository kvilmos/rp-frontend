import { DoubleSide, Mesh, MeshBasicMaterial, Shape, ShapeGeometry, Vector2 } from 'three';
import { Corner } from './blueprint-view/corner';
import { HalfEdge } from './HalfEdge';
import { Blueprint } from './blueprint-view/blueprint';
import { map } from './utils';

const defaultRoomTexture = {
  url: 'rooms/textures/hardwood.png',
  scale: 400,
};

export class Room {
  private blueprint: Blueprint;
  public corners: Corner[];

  /** floor plane for intersection testing */
  public floorMesh: Mesh | null = null;
  private edgePointer: HalfEdge | null = null;

  public interiorCorners: Corner[] = [];

  constructor(blueprint: Blueprint, corners: Corner[]) {
    this.blueprint = blueprint;
    this.corners = corners;

    this.updateWalls();
    this.updateInteriorCorners();
    this.generatePlane();
  }

  public getUuid(): string {
    const cornerUuids = map(this.corners, function (c: Corner) {
      return c.id;
    });
    cornerUuids.sort();
    return cornerUuids.join();
  }

  private generatePlane() {
    const points: Vector2[] = [];

    for (let i = 1; i < this.interiorCorners.length; i++) {
      points.push(new Vector2(this.interiorCorners[i].x, this.interiorCorners[i].y));
    }

    const shape = new Shape(points);
    const geometry = new ShapeGeometry(shape);
    this.floorMesh = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }));
    this.floorMesh.visible = false;
    this.floorMesh.rotation.set(Math.PI / 2, 0, 0);
    (<any>this.floorMesh).room = this; // js monkey patch ???
  }

  private updateInteriorCorners() {
    if (this.edgePointer) {
      let edge = this.edgePointer;

      while (true) {
        this.interiorCorners.push(edge.interiorStart() as Corner);
        edge.generatePlane();
        if (edge.next === this.edgePointer) {
          break;
        } else if (edge.next) {
          edge = edge.next;
        }
      }
    }
  }

  private updateWalls() {
    let prevEdge = null;
    let firstEdge = null;

    for (let i = 0; i < this.corners.length; i++) {
      const firstCorner = this.corners[i];
      const secondCorner = this.corners[(i + 1) % this.corners.length];

      const wallTo = firstCorner.wallTo(secondCorner);
      const wallFrom = firstCorner.wallFrom(secondCorner);

      let edge: HalfEdge | null = null;
      if (wallTo) {
        edge = new HalfEdge(wallTo, true, this);
      } else if (wallFrom) {
        edge = new HalfEdge(wallFrom, false, this);
      } else {
        console.log('ROOM:updateWalls() corners are not connected by a wall, uh oh');
      }

      if (i === 0) {
        firstEdge = edge;
      } else {
        edge!.prev = prevEdge;
        prevEdge!.next = edge;
        if (i + 1 === this.corners.length) {
          firstEdge!.prev = edge;
          edge!.next = firstEdge;
        }
      }
      prevEdge = edge;
    }

    this.edgePointer = firstEdge;
  }

  public getTexture() {
    var uuid = this.getUuid();
    var tex = this.blueprint.getFloorTexture(uuid);
    return tex || defaultRoomTexture;
  }
}
