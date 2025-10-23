import { Injectable } from '@angular/core';

import { Vector3 } from 'three';

import { Subject, takeUntil } from 'rxjs';
import { BLUEPRINT } from '../../common/constants/planner-constants';
import { HalfEdge } from './half_edge';
import { angle2pi, cycle_OnTest, removeIf, isClockwise, map, hasValue } from './utils';
import { Corner } from './corner';
import { Wall } from './wall';
import { Room } from './room';

@Injectable({
  providedIn: 'root',
})
export class Blueprint {
  public id!: number;
  private corners: Corner[] = [];
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private floorTextures: { [key: string]: boolean } = {};

  private readonly destroy$ = new Subject<void>();
  private readonly updateRoomSubject = new Subject();
  public readonly onUpdateRoom$ = this.updateRoomSubject.asObservable();

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

    const roomCorners = this.findRooms(this.corners);
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

  public findRooms(corners: Corner[]): Corner[][] {
    function _calculateTheta(previousCorner: Corner, currentCorner: Corner, nextCorner: Corner) {
      const theta = angle2pi(
        previousCorner.x - currentCorner.x,
        previousCorner.y - currentCorner.y,
        nextCorner.x - currentCorner.x,
        nextCorner.y - currentCorner.y
      );
      return theta;
    }

    function _removeDuplicateRooms(roomArray: Corner[][]): Corner[][] {
      const results: Corner[][] = [];
      const lookup: { [key: string]: boolean } = {};
      const hashFunc = function (corner: Corner) {
        return corner.id;
      };
      const sep = '-';
      for (let i = 0; i < roomArray.length; i++) {
        // rooms are cycles, shift it around to check uniqueness
        const room = roomArray[i];
        let add = true;
        let str;
        for (var j = 0; j < room.length; j++) {
          const roomShift = cycle_OnTest(room, j);
          str = map(roomShift, hashFunc).join(sep);
          if (lookup.hasOwnProperty(str)) {
            add = false;
          }
        }
        if (add && str) {
          results.push(roomArray[i]);
          lookup[str] = true;
        }
      }
      return results;
    }

    function _findTightestCycle(firstCorner: Corner, secondCorner: Corner): Corner[] {
      const stack: {
        corner: Corner;
        previousCorners: Corner[];
      }[] = [];

      let next: { corner: Corner; previousCorners: Corner[] } | undefined;
      next = {
        corner: secondCorner,
        previousCorners: [firstCorner],
      };

      const visited: { [key: string]: boolean } = {};
      visited[firstCorner.id] = true;

      while (next) {
        const currentCorner = next.corner;
        visited[currentCorner.id] = true;

        if (next.corner === firstCorner && currentCorner !== secondCorner) {
          return next.previousCorners;
        }

        const addToStack: Corner[] = [];
        const adjacentCorners = next.corner.adjacentCorners();
        for (let i = 0; i < adjacentCorners.length; i++) {
          const nextCorner = adjacentCorners[i];

          if (
            nextCorner.id in visited &&
            !(nextCorner === firstCorner && currentCorner !== secondCorner)
          ) {
            continue;
          }

          addToStack.push(nextCorner);
        }

        const previousCorners = next.previousCorners.slice(0);
        previousCorners.push(currentCorner);
        if (addToStack.length > 1) {
          // visit the ones with smallest theta first
          const previousCorner = next.previousCorners[next.previousCorners.length - 1];
          addToStack.sort(function (a, b) {
            return (
              _calculateTheta(previousCorner, currentCorner, b) -
              _calculateTheta(previousCorner, currentCorner, a)
            );
          });
        }

        if (addToStack.length > 0) {
          for (let i = 0; i < addToStack.length; i++) {
            stack.push({
              corner: addToStack[i],
              previousCorners: previousCorners,
            });
          }
        }

        next = stack.pop();
      }
      return [];
    }

    // find tightest loops, for each corner, for each adjacent
    // TODO: optimize this, only check corners with > 2 adjacents, or isolated cycles
    const loops: Corner[][] = [];

    corners.forEach((firstCorner) => {
      firstCorner.adjacentCorners().forEach((secondCorner) => {
        loops.push(_findTightestCycle(firstCorner, secondCorner));
      });
    });

    const uniqueLoops = _removeDuplicateRooms(loops);
    const uniqueCCWLoops = removeIf(uniqueLoops, isClockwise);

    return uniqueCCWLoops;
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
}
