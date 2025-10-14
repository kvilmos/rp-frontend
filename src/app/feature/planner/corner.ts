import { generateUUID } from 'three/src/math/MathUtils.js';
import { Wall } from './wall';
import { closestPointOnLine, distance } from './utils';
import { BLUEPRINT } from '../../common/constants/planner-constants';
import { Subject } from 'rxjs';
import { Blueprint } from './blueprint';

export class Corner {
  public id: string;

  public x: number;
  public y: number;

  private wallStarts: Wall[] = [];
  private wallEnds: Wall[] = [];

  private blueprint: Blueprint;

  private readonly deleteSubject = new Subject<Corner>();
  public readonly onDelete$ = this.deleteSubject.asObservable();

  constructor(blueprint: Blueprint, x: number, y: number, id?: string) {
    this.blueprint = blueprint;
    this.x = x;
    this.y = y;
    this.id = id || generateUUID();
  }

  public snapToAxis(tolerance: number): { x: boolean; y: boolean } {
    // try to snap this corner to an axis
    const snapped = {
      x: false,
      y: false,
    };

    this.adjacentCorners().forEach((corner) => {
      if (Math.abs(corner.x - this.x) < tolerance) {
        this.x = corner.x;
        snapped.x = true;
      }
      if (Math.abs(corner.y - this.y) < tolerance) {
        this.y = corner.y;
        snapped.y = true;
      }
    });
    return snapped;
  }

  public move(newX: number, newY: number): void {
    this.x = newX;
    this.y = newY;
    this.mergeWithIntersected();

    this.wallStarts.forEach((wall) => {
      wall.fireMoved();
    });

    this.wallEnds.forEach((wall) => {
      wall.fireMoved();
    });
  }

  public relativeMove(dx: number, dy: number) {
    this.move(this.x + dx, this.y + dy);
  }

  public adjacentCorners(): Corner[] {
    const retArray: Corner[] = [];
    for (let i = 0; i < this.wallStarts.length; i++) {
      retArray.push(this.wallStarts[i].getEnd());
    }
    for (let i = 0; i < this.wallEnds.length; i++) {
      retArray.push(this.wallEnds[i].getStart());
    }
    return retArray;
  }

  public attachStart(wall: Wall) {
    this.wallStarts.push(wall);
  }

  public attachEnd(wall: Wall) {
    this.wallEnds.push(wall);
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public mergeWithIntersected(): boolean {
    const corners = this.blueprint.getCorners();
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (this.distanceFromCorner(corner) < BLUEPRINT.CORNER_TOLERANCE && corner !== this) {
        this.combineWithCorner(corner);

        return true;
      }
    }

    const walls = this.blueprint.getWalls();
    for (var i = 0; i < walls.length; i++) {
      const wall = walls[i];
      if (this.distanceFromWall(wall) < BLUEPRINT.CORNER_TOLERANCE && !this.isWallConnected(wall)) {
        // update position to be on wall
        const intersection = closestPointOnLine(
          this.x,
          this.y,
          wall.getStart().x,
          wall.getStart().y,
          wall.getEnd().x,
          wall.getEnd().y
        );

        this.x = intersection.x;
        this.y = intersection.y;
        // merge this corner into wall by breaking wall into two parts
        this.blueprint.newWall(this, wall.getEnd());
        wall.setEnd(this);
        this.blueprint.update();

        return true;
      }
    }

    return false;
  }

  private combineWithCorner(corner: Corner) {
    this.x = corner.x;
    this.y = corner.y;

    // rewrite the other corner's wallStarts and wallEnds
    for (let i = corner.wallStarts.length - 1; i >= 0; i--) {
      corner.wallStarts[i].setStart(this);
    }
    for (let i = corner.wallEnds.length - 1; i >= 0; i--) {
      corner.wallEnds[i].setEnd(this);
    }
    // delete the other corner
    corner.removeAll();
    this.removeDuplicateWalls();
    this.blueprint.update();
  }

  public distanceFromCorner(corner: Corner): number {
    return this.distanceFrom(corner.x, corner.y);
  }

  public distanceFrom(x: number, y: number): number {
    return distance(x, y, this.x, this.y);
  }

  public detachWall(wall: Wall) {
    this.wallStarts = this.wallStarts.filter((w: Wall) => w !== wall);
    this.wallEnds = this.wallEnds.filter((w: Wall) => w !== wall);
    if (this.wallStarts.length == 0 && this.wallEnds.length == 0) {
      this.remove();
    }
  }

  private removeDuplicateWalls() {
    const wallEndPoints: { [key: string]: boolean } = {};
    const wallStartPoints: { [key: string]: boolean } = {};
    for (let i = this.wallStarts.length - 1; i >= 0; i--) {
      if (this.wallStarts[i].getEnd() === this) {
        this.wallStarts[i].remove();
      } else if (this.wallStarts[i].getEnd().id in wallEndPoints) {
        this.wallStarts[i].remove();
      } else {
        wallEndPoints[this.wallStarts[i].getEnd().id] = true;
      }
    }
    for (let i = this.wallEnds.length - 1; i >= 0; i--) {
      if (this.wallEnds[i].getStart() === this) {
        this.wallEnds[i].remove();
      } else if (this.wallEnds[i].getStart().id in wallStartPoints) {
        this.wallEnds[i].remove();
      } else {
        wallStartPoints[this.wallEnds[i].getStart().id] = true;
      }
    }
  }

  private isWallConnected(wall: Wall): boolean {
    for (let i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i] == wall) {
        return true;
      }
    }
    for (let i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i] == wall) {
        return true;
      }
    }
    return false;
  }

  public distanceFromWall(wall: Wall): number {
    return wall.distanceFrom(this.x, this.y);
  }

  public wallTo(corner: Corner): Wall | null {
    for (let i = 0; i < this.wallStarts.length; i++) {
      if (this.wallStarts[i].getEnd() === corner) {
        return this.wallStarts[i];
      }
    }
    return null;
  }

  public wallFrom(corner: Corner): Wall | null {
    for (let i = 0; i < this.wallEnds.length; i++) {
      if (this.wallEnds[i].getStart() === corner) {
        return this.wallEnds[i];
      }
    }
    return null;
  }

  public remove() {
    this.deleteSubject.next(this);
  }

  public removeAll() {
    console.log('removeAll?');

    for (let i = 0; i < this.wallStarts.length; i++) {
      this.wallStarts[i].remove();
      console.log('wallStarts?');
    }
    for (let i = 0; i < this.wallEnds.length; i++) {
      this.wallEnds[i].remove();
      console.log('wallEnds?');
    }

    this.remove();
  }

  public destroy() {
    this.deleteSubject.complete();
  }
}
