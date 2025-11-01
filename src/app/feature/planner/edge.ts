import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  Side,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { BlueprintScene } from './blueprint_scene';
import { HalfEdge } from './half_edge';
import { Wall } from './wall';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { DESIGN } from '../../common/constants/planner-constants';

export class Edge {
  private scene: BlueprintScene;
  private controls: OrbitControls;

  private edge: HalfEdge;
  private wall: Wall;
  private front: boolean;
  private visible: boolean = false;

  private edgeMeshes: Mesh[] = [];
  private baseMashes: Mesh[] = [];

  constructor(scene: BlueprintScene, edge: HalfEdge, controls: OrbitControls) {
    this.scene = scene;
    this.controls = controls;

    this.edge = edge;
    this.wall = edge.wall;
    this.front = edge.front;

    this.updateMesh();
    this.addToScene();
  }

  public remove(): void {
    this.removeFromScene();
  }

  private removeFromScene(): void {
    for (let i = 0; i < this.edgeMeshes.length; i++) {
      this.scene.remove(this.edgeMeshes[i]);
    }
    for (let i = 0; i < this.baseMashes.length; i++) {
      this.scene.remove(this.baseMashes[i]);
    }

    this.edgeMeshes = [];
    this.baseMashes = [];
  }

  private addToScene(): void {
    for (let i = 0; i < this.edgeMeshes.length; i++) {
      this.scene.add(this.edgeMeshes[i]);
    }
    for (let i = 0; i < this.baseMashes.length; i++) {
      this.scene.add(this.baseMashes[i]);
    }

    this.updateVisibility();
  }

  private updateMesh(): void {
    const textureLoader = new TextureLoader();
    const texturePath = '/assets/images/textures/wall.jpg';
    const wallTexture = textureLoader.load(texturePath);

    wallTexture.wrapS = RepeatWrapping;
    wallTexture.wrapT = RepeatWrapping;
    wallTexture.colorSpace = SRGBColorSpace;

    const wallMaterial = new MeshStandardMaterial({
      map: wallTexture,
      side: FrontSide,
      roughness: 0.9,
    });

    const fillerMaterial = new MeshStandardMaterial({
      color: DESIGN.EDGE_FILLER_COLOR,
      side: DoubleSide,
      roughness: 0.9,
    });

    this.edgeMeshes.push(
      this.makeWall(this.edge.exteriorStart(), this.edge.exteriorEnd(), fillerMaterial)
    );

    this.edgeMeshes.push(
      this.makeWall(this.edge.interiorStart(), this.edge.interiorEnd(), wallMaterial)
    );

    this.baseMashes.push(this.buildFiller(this.edge, 0, BackSide, DESIGN.EDGE_BASE_COLOR));

    this.edgeMeshes.push(
      this.buildFiller(this.edge, this.wall.height, DoubleSide, DESIGN.EDGE_FILLER_COLOR)
    );

    this.edgeMeshes.push(
      this.buildSideFilter(
        this.edge.interiorStart(),
        this.edge.exteriorStart(),
        this.wall.height,
        DESIGN.EDGE_SIDE_COLOR
      )
    );

    this.edgeMeshes.push(
      this.buildSideFilter(
        this.edge.interiorEnd(),
        this.edge.exteriorEnd(),
        this.wall.height,
        DESIGN.EDGE_SIDE_COLOR
      )
    );
  }

  private buildSideFilter(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    height: number,
    color: number
  ): Mesh {
    const v1 = this.toVec3(p1);
    const v2 = this.toVec3(p2);
    const v3 = this.toVec3(p2, height);
    const v4 = this.toVec3(p1, height);

    const geometry = new BufferGeometry();
    const vertices = new Float32Array([
      v1.x, v1.y, v1.z, // 0. vertex
      v2.x, v2.y, v2.z, // 1. vertex
      v3.x, v3.y, v3.z, // 2. vertex
      v4.x, v4.y, v4.z, // 3. vertex
    ]); 
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

    const indices = [
      0, 1, 2, // (v1, v2, v3)
      0, 2, 3, // (v1, v3, v4)
    ];
    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    const fillerMaterial = new MeshBasicMaterial({
      color: color,
      side: DoubleSide,
    });

    const filler = new Mesh(geometry, fillerMaterial);
    return filler;
  }

  private buildFiller(edge: HalfEdge, height: number, side: Side, color: number): Mesh {
    const points = [
      this.toVec2(edge.exteriorStart()),
      this.toVec2(edge.exteriorEnd()),
      this.toVec2(edge.interiorEnd()),
      this.toVec2(edge.interiorStart()),
    ];

    const fillerMaterial = new MeshBasicMaterial({
      color: color,
      side: side,
    });

    const shape = new Shape(points);
    const geometry = new ShapeGeometry(shape);

    const filler = new Mesh(geometry, fillerMaterial);
    filler.rotation.set(Math.PI / 2, 0, 0);
    filler.position.y = height;

    return filler;
  }

  private makeWall(
    start: { x: number; y: number },
    end: { x: number; y: number },
    material: Material
  ): Mesh {
    const height = this.wall.height;

    const v1 = new Vector3(start.x, 0, start.y);
    const v2 = new Vector3(end.x, 0, end.y);
    const v3 = new Vector3(end.x, height, end.y);
    const v4 = new Vector3(start.x, height, start.y);

    const geometry = new BufferGeometry();

    const vertices = new Float32Array([
      v1.x, v1.y, v1.z, // index: 0
      v2.x, v2.y, v2.z, // index: 1
      v3.x, v3.y, v3.z, // index: 2
      v4.x, v4.y, v4.z, // index: 3
    ]);

    const indices = [0, 1, 2, 0, 2, 3];

    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    const uvs = new Float32Array([
      0, 0, // v1 UV
      1, 0, // v2 UV
      1, 1, // v3 UV
      0, 1, // v4 UV
    ]);

    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();

    const mesh = new Mesh(geometry, material);
    return mesh;
  }

  public updateVisibility(): void {
    const start = this.edge.interiorStart();
    const end = this.edge.interiorEnd();
    const x = end.x - start.x;
    const y = end.y - start.y;
    const normal = new Vector3(-y, 0, x);
    normal.normalize();

    const position = this.controls.object.position.clone();
    const focus = new Vector3((start.x + end.x) / 2.0, 0, (start.y + end.y) / 2.0);
    const direction = position.sub(focus).normalize();

    const dot = normal.dot(direction);

    this.visible = dot >= 0;

    this.edgeMeshes.forEach((plane) => {
      plane.visible = this.visible;
    });
  }

  private toVec2(pos: { x: number; y: number }): Vector2 {
    return new Vector2(pos.x, pos.y);
  }

  private toVec3(pos: { x: number; y: number }, height?: number): Vector3 {
    height = height || 0;
    return new Vector3(pos.x, height, pos.y);
  }
}
