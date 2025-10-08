import { generateUUID } from 'three/src/math/MathUtils.js';
import { Blueprint } from './blueprint';
import { Wall } from './wall';
import { closestPointOnLine, distance, removeValue } from '../utils';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { Callbacks } from '../callbacks';

export class Corner {
  public id: string;
  public x: number;
  public y: number;

  private wallStarts: Wall[] = [];
  private wallEnds: Wall[] = [];

  private blueprint: Blueprint;

  private deleted_callbacks = new Callbacks();

  constructor(blueprint: Blueprint, x: number, y: number, id?: string) {
    this.blueprint = blueprint;
    this.x = x;
    this.y = y;
    this.id = id || generateUUID();
  }

  public adjacentCorners(): Corner[] {
    const retArray = [];
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
      if (this.distanceFromCorner(corner) < BLUEPRINT.CORNER_TOLERANCE && corner != this) {
        this.combineWithCorner(corner);
        return true;
      }
    }

    for (var i = 0; i < this.blueprint.getWalls().length; i++) {
      var wall = this.blueprint.getWalls()[i];
      if (this.distanceFromWall(wall) < BLUEPRINT.CORNER_TOLERANCE && !this.isWallConnected(wall)) {
        // update position to be on wall
        var intersection = closestPointOnLine(
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

    // absorb the other corner's wallStarts and wallEnds
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
    removeValue(this.wallStarts, wall);
    removeValue(this.wallEnds, wall);
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
    this.deleted_callbacks.fire(this);
  }

  private removeAll() {
    for (let i = 0; i < this.wallStarts.length; i++) {
      this.wallStarts[i].remove();
    }
    for (let i = 0; i < this.wallEnds.length; i++) {
      this.wallEnds[i].remove();
    }
    this.remove();
  }
}
