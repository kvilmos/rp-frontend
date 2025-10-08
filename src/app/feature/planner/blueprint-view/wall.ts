import { generateUUID } from 'three/src/math/MathUtils.js';
import { Corner } from './corner';
import { Callbacks } from '../callbacks';
import { pointDistanceFromLine } from '../utils';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { HalfEdge } from '../HalfEdge';

export class Wall {
  public id: string;
  private start: Corner;
  private end: Corner;

  public frontEdge: HalfEdge | null = null;
  public backEdge: HalfEdge | null = null;
  public orphan = false;

  private moved_callbacks = new Callbacks();
  private deleted_callbacks = new Callbacks();

  public thickness = BLUEPRINT.WALL_THICKNESS; // Configuration.getNumericValue(configWallThickness);
  public height = BLUEPRINT.WALL_HEIGHT; //Configuration.getNumericValue(configWallHeight);

  constructor(start: Corner, end: Corner) {
    this.id = generateUUID();

    this.start = start;
    this.end = end;

    this.start.attachStart(this);
    this.end.attachEnd(this);
  }

  public getStartX(): number {
    return this.start.getX();
  }

  public getStartY(): number {
    return this.start.getY();
  }

  public getEndX(): number {
    return this.end.getX();
  }

  public getEndY(): number {
    return this.end.getY();
  }

  public fireMoved() {
    this.moved_callbacks.fire();
  }

  public setStart(corner: Corner) {
    this.start.detachWall(this);
    corner.attachStart(this);
    this.start = corner;
    this.fireMoved();
  }

  public setEnd(corner: Corner) {
    this.end.detachWall(this);
    corner.attachEnd(this);
    this.end = corner;
    this.fireMoved();
  }

  public getStart(): Corner {
    return this.start;
  }

  public getEnd(): Corner {
    return this.end;
  }

  public distanceFrom(x: number, y: number): number {
    return pointDistanceFromLine(
      x,
      y,
      this.getStartX(),
      this.getStartY(),
      this.getEndX(),
      this.getEndY()
    );
  }

  public resetFrontBack() {
    this.frontEdge = null;
    this.backEdge = null;
    this.orphan = false;
  }

  public remove() {
    this.start.detachWall(this);
    this.end.detachWall(this);
    this.deleted_callbacks.fire(this);
  }
}
