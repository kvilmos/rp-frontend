import { inject, Injectable } from '@angular/core';
import { Vector3 } from 'three';
import { Subject, takeUntil } from 'rxjs';
import { BLUEPRINT } from '../../common/constant/planner.constant';
import { HalfEdge } from './half_edge';
import { map, hasValue } from './utils';
import { Corner } from './corner';
import { Wall } from './wall';
import { Room } from './room';
import { CompleteBlueprint } from './blueprint_load';
import { GeometryEngine } from './geometry-engine';

@Injectable({
  providedIn: 'root',
})
export class Blueprint {
  public id: number | undefined;
  private corners: Corner[] = [];
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private floorTextures: { [key: string]: boolean } = {};

  private readonly destroy$ = new Subject<void>();
  private readonly updateRoomSubject = new Subject();
  public readonly onUpdateRoom$ = this.updateRoomSubject.asObservable();
  private readonly geometryEngine = inject(GeometryEngine);
  constructor() {}

  public newCorner(x: number, y: number, id?: string): Corner {
    const corner = new Corner(this, x, y, id);
    this.corners.push(corner);

    corner.onDelete$.pipe(takeUntil(this.destroy$)).subscribe((cornerToDelete: Corner) => {
      this.removeCorner(cornerToDelete);
    });

    return corner;
  }

  private removeCorner(corner: Corner) {
    this.corners = this.corners.filter((c: Corner) => c !== corner);
  }

  public newWall(start: Corner, end: Corner): Wall {
    const wall = new Wall(start, end);
    this.walls.push(wall);

    wall.onDelete$.pipe(takeUntil(this.destroy$)).subscribe((wallToDestroy: Wall) => {
      this.removeWall(wallToDestroy);
    });
    this.update();

    return wall;
  }

  private removeWall(wall: Wall) {
    this.walls = this.walls.filter((w: Wall) => w !== wall);
    this.update();
  }

  public getCorners(): Corner[] {
    return this.corners;
  }

  public getWalls(): Wall[] {
    return this.walls;
  }

  public getRooms(): Room[] {
    return this.rooms;
  }

  public getCenter(): Vector3 {
    return this.getDimensions(true);
  }

  public getSize(): Vector3 {
    return this.getDimensions(false);
  }

  public getDimensions(center: boolean): Vector3 {
    let xMin = Infinity;
    let xMax = -Infinity;
    let zMin = Infinity;
    let zMax = -Infinity;

    for (let i = 0; i < this.corners.length; i++) {
      const corner = this.corners[i];
      if (corner.x < xMin) xMin = corner.x;
      if (corner.x > xMax) xMax = corner.x;
      if (corner.y < zMin) zMin = corner.y;
      if (corner.y > zMax) zMax = corner.y;
    }

    if (xMin === Infinity || xMax === -Infinity || zMin === Infinity || zMax === -Infinity) {
      return new Vector3();
    }
    if (center) {
      return new Vector3((xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5);
    }
    return new Vector3(xMax - xMin, 0, zMax - zMin);
  }

  public update(): void {
    for (let i = 0; i < this.walls.length; i++) {
      this.walls[i].resetFrontBack();
    }

    const roomCorners = this.geometryEngine.findRooms(this.corners);
    this.rooms = [];
    for (let i = 0; i < roomCorners.length; i++) {
      this.rooms.push(new Room(this, roomCorners[i]));
    }

    this.assignOrphanEdges();

    this.updateFloorTextures();
    this.updateRoomSubject.next('update');
  }

  private updateFloorTextures(): void {
    var uuids = map(this.rooms, function (room: Room) {
      return room.getUuid();
    });
    for (var uuid in this.floorTextures) {
      if (!hasValue(uuids, uuid)) {
        delete this.floorTextures[uuid];
      }
    }
  }

  private assignOrphanEdges(): void {
    const orphanWalls = [];

    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      if (!wall.backEdge && !wall.frontEdge) {
        wall.orphan = true;
        const back = new HalfEdge(wall, false);
        back.generatePlane();
        const front = new HalfEdge(wall, true);
        front.generatePlane();
        orphanWalls.push(wall);
      }
    }
  }

  public overlappedCorner(x: number, y: number, tolerance?: number): Corner | null {
    tolerance = tolerance || BLUEPRINT.DEFAULT_TOLERANCE;
    for (var i = 0; i < this.corners.length; i++) {
      if (this.corners[i].distanceFrom(x, y) < tolerance) {
        return this.corners[i];
      }
    }
    return null;
  }

  public overlappedWall(x: number, y: number, tolerance?: number): Wall | null {
    tolerance = tolerance || BLUEPRINT.DEFAULT_TOLERANCE;
    for (var i = 0; i < this.walls.length; i++) {
      if (this.walls[i].distanceFrom(x, y) < tolerance) {
        return this.walls[i];
      }
    }
    return null;
  }

  public wallEdges(): HalfEdge[] {
    const edges: HalfEdge[] = [];

    this.walls.forEach((wall) => {
      if (wall.frontEdge) {
        edges.push(wall.frontEdge);
      }
      if (wall.backEdge) {
        edges.push(wall.backEdge);
      }
    });
    return edges;
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getFloorTexture(uuid: string) {
    if (uuid in this.floorTextures) {
      return this.floorTextures[uuid];
    } else {
      return null;
    }
  }

  public clear(): void {
    for (let i = 0; i < this.walls.length; i++) {
      this.removeWall(this.walls[i]);
    }
    for (let i = 0; i < this.corners.length; i++) {
      this.corners[i].destroy();
    }

    this.corners = [];
    this.walls = [];
    this.rooms = [];
    this.floorTextures = {};
    this.id = undefined;
  }

  public loadBlueprint(blueprint: CompleteBlueprint): void {
    this.id = blueprint.id;

    const cornerMap = new Map<string, Corner>();
    if (blueprint.corners) {
      for (let i = 0; i < blueprint.corners.length; i++) {
        const corner = this.newCorner(
          blueprint.corners[i].x,
          blueprint.corners[i].y,
          blueprint.corners[i].id
        );
        cornerMap.set(blueprint.corners[i].id, corner);
      }
    }

    if (blueprint.walls) {
      for (let i = 0; i < blueprint.walls.length; i++) {
        const startId = blueprint.walls[i].startCornerId;
        const endId = blueprint.walls[i].endCornerId;

        const startCorner = cornerMap.get(startId);
        const endCorner = cornerMap.get(endId);
        if (startCorner && endCorner) {
          this.newWall(startCorner, endCorner);
        }
      }
    }
  }
}
