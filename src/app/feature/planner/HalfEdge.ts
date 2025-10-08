import { BufferAttribute, BufferGeometry, Matrix4, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { Wall } from './blueprint-view/wall';
import { Room } from './Room';
import { getAngle, angle2pi, distance } from './utils';
import { Corner } from './blueprint-view/corner';

export class HalfEdge {
  public next: HalfEdge | null = null;
  public prev: HalfEdge | null = null;

  private room: Room | null = null;
  public wall: Wall;
  private front: boolean;

  public offset: number;
  public height: number;

  public plane: Mesh | null = null;
  public interiorTransform = new Matrix4();
  public invInteriorTransform = new Matrix4();
  private exteriorTransform = new Matrix4();
  private invExteriorTransform = new Matrix4();

  constructor(wall: Wall, front: boolean, room?: Room) {
    this.room = room ?? null;
    this.wall = wall;
    this.front = front || false;

    this.offset = wall.thickness / 2.0;
    this.height = wall.height;

    if (this.front) {
      this.wall.frontEdge = this;
    } else {
      this.wall.backEdge = this;
    }
  }

  //public generatePlane = function () {
  public generatePlane = () => {
    function transformCorner(corner: Corner) {
      return new Vector3(corner.x, 0, corner.y);
    }

    const v1 = transformCorner(this.interiorStart() as Corner);
    const v2 = transformCorner(this.interiorEnd() as Corner);
    const v3 = v2.clone();
    v3.y = this.wall.height;
    const v4 = v1.clone();
    v4.y = this.wall.height;

    console.log('v1:', v1);
    console.log('v2:', v2);
    console.log('v3:', v3);
    console.log('v4:', v4);

    var geometry = new BufferGeometry();

    // geometry.vertices = [v1, v2, v3, v4];
    const vertices = new Float32Array([
      v1.x,
      v1.y,
      v1.z,
      v2.x,
      v2.y,
      v2.z,
      v3.x,
      v3.y,
      v3.z,
      v4.x,
      v4.y,
      v4.z,
    ]);

    // geometry.faces.push(new Face3(0, 1, 2));
    // geometry.faces.push(new Face3(0, 2, 3));

    const indices = [0, 1, 2, 0, 2, 3];
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    //geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    this.plane = new Mesh(geometry, new MeshBasicMaterial());
    this.plane.visible = false;
    this.plane.userData['edge'] = this; // js monkey patch

    this.computeTransforms(
      this.interiorTransform,
      this.invInteriorTransform,
      this.interiorStart() as Corner,
      this.interiorEnd() as Corner
    );
    this.computeTransforms(
      this.exteriorTransform,
      this.invExteriorTransform,
      this.exteriorStart() as Corner,
      this.exteriorEnd() as Corner
    );
  };

  private computeTransforms(
    transform: Matrix4,
    invTransform: Matrix4,
    start: Corner,
    end: Corner
  ): void {
    const v1 = start;
    const v2 = end;

    const angle = getAngle(1, 0, v2.x - v1.x, v2.y - v1.y);

    const tt = new Matrix4();
    tt.makeTranslation(-v1.x, 0, -v1.y);
    const tr = new Matrix4();
    tr.makeRotationY(-angle);
    transform.multiplyMatrices(tr, tt);
    invTransform.copy(transform).invert;
  }

  private getStart() {
    if (this.front) {
      return this.wall.getStart();
    } else {
      return this.wall.getEnd();
    }
  }

  private getEnd() {
    if (this.front) {
      return this.wall.getEnd();
    } else {
      return this.wall.getStart();
    }
  }

  public interiorStart(): { x: number; y: number } {
    const vec = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x + vec.x,
      y: this.getStart().y + vec.y,
    };
  }

  public interiorEnd(): { x: number; y: number } {
    const vec = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x + vec.x,
      y: this.getEnd().y + vec.y,
    };
  }

  public exteriorStart(): { x: number; y: number } {
    const vec = this.halfAngleVector(this.prev, this);
    return {
      x: this.getStart().x - vec.x,
      y: this.getStart().y - vec.y,
    };
  }

  public exteriorEnd(): { x: number; y: number } {
    const vec = this.halfAngleVector(this, this.next);
    return {
      x: this.getEnd().x - vec.x,
      y: this.getEnd().y - vec.y,
    };
  }

  private halfAngleVector(v1: HalfEdge | null, v2: HalfEdge | null): { x: number; y: number } {
    if (!v1 && !v2) {
      return { x: 0, y: 0 };
    }

    let v1startX = 0;
    let v1startY = 0;
    let v1endX = 0;
    let v1endY = 0;

    let v2startX = 0;
    let v2startY = 0;
    let v2endX = 0;
    let v2endY = 0;

    if (v1 && v2) {
      v1startX = v1.getStart().x;
      v1startY = v1.getStart().y;
      v1endX = v1.getEnd().x;
      v1endY = v1.getEnd().y;

      v2startX = v2.getStart().x;
      v2startY = v2.getStart().y;
      v2endX = v2.getEnd().x;
      v2endY = v2.getEnd().y;
    } else if (!v1 && v2) {
      v1startX = v2.getStart().x - (v2.getEnd().x - v2.getStart().x);
      v1startY = v2.getStart().y - (v2.getEnd().y - v2.getStart().y);
      v1endX = v2.getStart().x;
      v1endY = v2.getStart().y;

      v2startX = v2.getStart().x;
      v2startY = v2.getStart().y;
      v2endX = v2.getEnd().x;
      v2endY = v2.getEnd().y;
    } else if (v1 && !v2) {
      v1startX = v1.getStart().x;
      v1startY = v1.getStart().y;
      v1endX = v1.getEnd().x;
      v1endY = v1.getEnd().y;

      v2startX = v1.getEnd().x;
      v2startY = v1.getEnd().y;
      v2endX = v1.getEnd().x + (v1.getEnd().x - v1.getStart().x);
      v2endY = v1.getEnd().y + (v1.getEnd().y - v1.getStart().y);
    }
    /*
      if (!v1 && v2) {
        v1startX = v2.getStart().x - (v2.getEnd().x - v2.getStart().x);
        v1startY = v2.getStart().y - (v2.getEnd().y - v2.getStart().y);
        v1endX = v2.getStart().x;
        v1endY = v2.getStart().y;
      } else if (v1) {
        v1startX = <number>v1.getStart().x;
        v1startY = <number>v1.getStart().y;
        v1endX = v1.getEnd().x;
        v1endY = v1.getEnd().y;
      }


      if (!v2 && v1) {
        v2startX = v1.getEnd().x;
        v2startY = v1.getEnd().y;
        v2endX = v1.getEnd().x + (v1.getEnd().x - v1.getStart().x);
        v2endY = v1.getEnd().y + (v1.getEnd().y - v1.getStart().y);
      } else if (v2) {
        v2startX = v2.getStart().x;
        v2startY = v2.getStart().y;
        v2endX = v2.getEnd().x;
        v2endY = v2.getEnd().y;
      }
    */

    const theta = angle2pi(v1startX - v1endX, v1startY - v1endY, v2endX - v1endX, v2endY - v1endY);

    const cs = Math.cos(theta / 2.0);
    const sn = Math.sin(theta / 2.0);

    const v2dx = v2endX - v2startX;
    const v2dy = v2endY - v2startY;

    const vx = v2dx * cs - v2dy * sn;
    const vy = v2dx * sn + v2dy * cs;

    const mag = distance(0, 0, vx, vy);
    if (mag < 0.0001) return { x: 0, y: 0 };
    const desiredMag = this.offset / sn;
    const scalar = desiredMag / mag;

    const halfAngleVector = {
      x: vx * scalar,
      y: vy * scalar,
    };

    return halfAngleVector;
  }
}
