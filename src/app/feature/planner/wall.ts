import { generateUUID } from 'three/src/math/MathUtils.js';
import { Corner } from './corner';
import { pointDistanceFromLine } from './blueprint3d-utils';
import { BLUEPRINT } from '../../common/constant/planner.constant';
import { HalfEdge } from './half_edge';
import { Subject } from 'rxjs';

const defaultWallTexture = {
  url: 'rooms/textures/wallmap.png',
  stretch: true,
  scale: 0,
};

export class Wall {
  public id: string;
  private start: Corner;
  private end: Corner;

  public frontEdge: HalfEdge | null = null;
  public backEdge: HalfEdge | null = null;

  public frontTexture = defaultWallTexture;
  public backTexture = defaultWallTexture;

  public orphan = false;

  private readonly deleteSubject = new Subject<Wall>();
  public readonly onDelete$ = this.deleteSubject.asObservable();
  private readonly moveSubject = new Subject<Wall>();
  public readonly onMove$ = this.moveSubject.asObservable();

  public thickness = BLUEPRINT.WALL_THICKNESS;
  public height = BLUEPRINT.WALL_HEIGHT;

  constructor(start: Corner, end: Corner) {
    this.id = generateUUID();
    this.start = start;
    this.end = end;

    this.start.attachStart(this);
    this.end.attachEnd(this);
  }

  public getStartId(): string {
    return this.start.id;
  }

  public getStartX(): number {
    return this.start.getX();
  }

  public getStartY(): number {
    return this.start.getY();
  }

  public getEndId(): string {
    return this.end.id;
  }

  public getEndX(): number {
    return this.end.getX();
  }

  public getEndY(): number {
    return this.end.getY();
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

  public snapToAxis(tolerance: number) {
    this.start.snapToAxis(tolerance);
    this.end.snapToAxis(tolerance);
  }

  public relativeMove(dx: number, dy: number) {
    this.start.relativeMove(dx, dy);
    this.end.relativeMove(dx, dy);
  }

  public fireMoved() {
    this.moveSubject.next(this);
  }

  public remove() {
    this.start.detachWall(this);
    this.end.detachWall(this);
    this.deleteSubject.next(this);
  }

  public destroy() {
    this.deleteSubject.complete();
    this.moveSubject.complete();
  }
}
