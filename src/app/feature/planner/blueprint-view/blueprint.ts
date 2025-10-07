import { Vector3 } from 'three';
import { Corner } from './corner';

export class Blueprint {
  private corners: Corner[] = [];

  constructor() {}

  public newCorner(x: number, y: number, id?: string): Corner {
    var corner = new Corner(this, x, y, id);
    this.corners.push(corner);

    /*
      corner.fireOnDelete(() => {
        this.removeCorner;
      });
      this.new_corner_callbacks.fire(corner);
    */

    return corner;
  }

  public getCorners(): Corner[] {
    return this.corners;
  }

  public getCenter() {
    return this.getDimensions();
  }

  public getDimensions(): Vector3 {
    const xMin = Infinity;
    const xMax = -Infinity;
    const zMin = Infinity;
    const zMax = -Infinity;

    // NO CORNERS YET
    /*this.corners.forEach((corner) => {
      if (corner.x < xMin) xMin = corner.x;
      if (corner.x > xMax) xMax = corner.x;
      if (corner.y < zMin) zMin = corner.y;
      if (corner.y > zMax) zMax = corner.y;
    });*/

    if (xMin == Infinity || xMax == -Infinity || zMin == Infinity || zMax == -Infinity) {
      return new Vector3();
    }
    return new Vector3((xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5);
  }
}
