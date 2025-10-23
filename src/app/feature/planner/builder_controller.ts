import { BlueprintScene } from './blueprint_scene';
import {
  BufferGeometry,
  Intersection,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Item } from './item';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ElementRef, inject, Injectable } from '@angular/core';

export enum ControllerState {
  UNSELECTED,
  SELECTED,
  DRAGGING,
  ROTATING,
  DELETE,
}

const LAYER_FURNITURE = 0;

function createRaycastDebugger(start: Vector3, end: Vector3): Line {
  const geometry = new BufferGeometry().setFromPoints([start, end]);
  const material = new LineBasicMaterial({ color: 0xff00ff });
  const line = new Line(geometry, material);
  return line;
}

@Injectable({ providedIn: 'root' })
export class DesignController {
  public state = ControllerState.UNSELECTED;
  public selectedObject: Item | null = null;
  private intersectedObject: Item | null = null;
  private intersectedObjectData: Intersection | null = null;
  private mouseoverObject: Item | null = null;
  private groundPlane!: Mesh;

  private camControls!: OrbitControls;
  private mouse = new Vector2();
  private mouseMoved = false;
  private mouseDown = false;
  private isDragging = false;

  private renderer!: WebGLRenderer;
  private camera!: PerspectiveCamera;
  private readonly bpScene = inject(BlueprintScene);
  constructor() {}

  public init(
    canvasRef: ElementRef<HTMLCanvasElement>,
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    camControls: OrbitControls
  ): void {
    this.renderer = renderer;
    this.camera = camera;
    this.camControls = camControls;

    this.createGroundPlane();
  }

  private createGroundPlane(): void {
    const size = 10000;
    this.groundPlane = new Mesh(
      new PlaneGeometry(size, size),
      new MeshBasicMaterial({ visible: false })
    );
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.bpScene.add(this.groundPlane);
  }

  public switchState(newState: number): void {
    if (newState !== this.state) {
      this.onExit(this.state);
      this.onEntry(newState);
    }

    this.state = newState;
  }

  private onEntry(state: number): void {
    switch (state) {
      case ControllerState.UNSELECTED:
        this.setSelectedObject(null);
        this.camControls.enabled = true;
        break;
      case ControllerState.SELECTED:
        this.camControls.enabled = true;
        break;
      case ControllerState.DRAGGING:
        this.clickPressed();
        this.camControls.enabled = false;
        break;
      case ControllerState.ROTATING:
        this.camControls.enabled = false;
        break;
      case ControllerState.DELETE:
        this.setSelectedObject(null);
        this.camControls.enabled = true;
        break;
    }
  }

  private onExit(state: number): void {
    switch (state) {
      case ControllerState.UNSELECTED:
      case ControllerState.SELECTED:
      case ControllerState.DRAGGING:
      case ControllerState.ROTATING:
    }
  }

  public setSelectedObject(object: Item | null) {
    if (this.state === ControllerState.UNSELECTED) {
      this.switchState(ControllerState.SELECTED);
    }
    if (this.selectedObject !== null) {
      this.selectedObject.setUnselected();
    }
    if (object !== null) {
      this.selectedObject = object;
      this.selectedObject.setSelected();
    } else {
      this.selectedObject = null;
    }
  }

  private mouseToVec3(vec2: Vector2): Vector3 {
    const normVec2 = this.normalizeVector2(vec2);
    const vector = new Vector3(normVec2.x, normVec2.y, 0.5);
    vector.unproject(this.camera);

    return vector;
  }

  private normalizeVector2(vec2: Vector2) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = vec2.x - rect.left;
    const y = vec2.y - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1;
    const normalizedY = -(y / rect.height) * 2 + 1;

    return new Vector2(normalizedX, normalizedY);
  }

  public mouseMoveEvent(event: MouseEvent): void {
    this.mouseMoved = true;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;

    if (!this.mouseDown) {
      this.updateIntersections();
    }

    switch (this.state) {
      case ControllerState.UNSELECTED:
        this.updateMouseover();
        break;
      case ControllerState.SELECTED:
        this.updateMouseover();
        break;
      case ControllerState.DRAGGING:
        if (this.selectedObject) {
          const intersection = this.itemIntersection(this.mouse);
          if (intersection) {
            this.selectedObject.clickDragged(intersection);
          }
        }
        break;
      case ControllerState.ROTATING:
        if (this.selectedObject) {
          const intersection = this.itemIntersection(this.mouse);
          if (intersection) {
            this.selectedObject.rotate(intersection);
          }
        }
        break;
      case ControllerState.DELETE:
        this.updateMouseover();
        break;
    }
  }

  public mouseDownEvent(event: MouseEvent): void {
    this.mouseMoved = false;
    this.mouseDown = true;

    switch (this.state) {
      case ControllerState.UNSELECTED:
        if (this.intersectedObject) {
          this.setSelectedObject(this.intersectedObject);
          if (!this.intersectedObject.fixed) {
            this.switchState(ControllerState.DRAGGING);
            this.clickPressed();
          }
        }
        break;
      case ControllerState.SELECTED:
        if (this.intersectedObject && this.intersectedObject === this.selectedObject) {
          if (
            this.intersectedObjectData &&
            this.intersectedObjectData.object.name === 'ROTATION_GIZMO'
          ) {
            const intersectionOnPlane = this.itemIntersection(this.mouse);
            if (intersectionOnPlane) {
              this.selectedObject.startRotation(intersectionOnPlane);
            }
            this.switchState(ControllerState.ROTATING);
          } else {
            this.switchState(ControllerState.DRAGGING);
          }
        } else if (this.intersectedObject) {
          this.setSelectedObject(this.intersectedObject);
          if (!this.intersectedObject.fixed) {
            this.switchState(ControllerState.DRAGGING);
          }
        } else {
          this.switchState(ControllerState.UNSELECTED);
        }
        break;
      case ControllerState.DRAGGING:
        break;
      case ControllerState.ROTATING:
        break;
      case ControllerState.DELETE:
        if (this.intersectedObject) {
          this.bpScene.removeItem(this.intersectedObject);
        }
        break;
    }
  }

  public mouseUpEvent(event: MouseEvent): void {
    this.mouseDown = false;

    switch (this.state) {
      case ControllerState.UNSELECTED:
        if (!this.mouseMoved) {
          // checkWallsAndFloors();
        }
        break;
      case ControllerState.SELECTED:
        if (this.intersectedObject === null && !this.mouseMoved) {
          this.switchState(ControllerState.UNSELECTED);
          // checkWallsAndFloors();
        }
        break;
      case ControllerState.DRAGGING:
        this.switchState(ControllerState.SELECTED);
        break;
      case ControllerState.ROTATING:
        this.switchState(ControllerState.SELECTED);
        break;
    }
  }

  private updateMouseover(): void {
    if (this.intersectedObject !== null) {
      if (this.mouseoverObject !== null) {
        if (this.mouseoverObject !== this.intersectedObject) {
          this.mouseoverObject.mouseOff();
          this.mouseoverObject = this.intersectedObject;
          this.mouseoverObject.mouseOver(this.state);
        }
      } else {
        this.mouseoverObject = this.intersectedObject;
        this.mouseoverObject.mouseOver(this.state);
      }
    } else if (this.mouseoverObject !== null) {
      this.mouseoverObject.mouseOff();
      this.mouseoverObject = null;
    }
  }

  private updateIntersections(): void {
    const items = this.bpScene.getItems();
    const intersects = this.getIntersections(this.mouse, items);

    this.intersectedObject = null;
    this.intersectedObjectData = null;

    if (intersects.length > 0) {
      const firstHit = intersects[0];

      this.intersectedObjectData = firstHit;
      let currentObject: Object3D | null = firstHit.object;
      while (currentObject) {
        if (currentObject instanceof Item) {
          this.intersectedObject = currentObject;
          return;
        }
        currentObject = currentObject.parent;
      }
    }
  }

  private clickPressed(vec2?: Vector2) {
    vec2 = vec2 || this.mouse;
    if (this.selectedObject) {
      const intersection = this.itemIntersection(this.mouse);
      if (intersection) {
        this.selectedObject.clickPressed(intersection);
      }
    }
  }

  private itemIntersection(vec2: Vector2): Intersection | null {
    const intersections = this.getIntersections(vec2, [this.groundPlane]);
    if (intersections && intersections.length > 0) {
      return intersections[0];
    } else {
      return null;
    }
  }

  private getIntersections(vec2: Vector2, objects: Object3D[]): Intersection[] {
    const vector = this.mouseToVec3(vec2);
    const direction = vector.sub(this.camera.position).normalize();
    const raycaster = new Raycaster(this.camera.position, direction);

    raycaster.layers.disableAll();
    raycaster.layers.enable(LAYER_FURNITURE);

    return raycaster.intersectObjects(objects, true);
  }
}
