import {
  Box3,
  Group,
  Intersection,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
  Vector3,
} from 'three';
import { BlueprintScene } from './blueprint_scene';
import { Furniture } from '../furniture/furniture';
import { ControllerState } from './builder_controller';

const LAYER_FURNITURE = 0;
const LAYER_GIZMO = 1;

const SNAP_ANGLE_DEGREES = 45;
const SNAP_THRESHOLD_DEGREES = 5;

export abstract class Item extends Group {
  protected scene: BlueprintScene;
  public furniture: Furniture;
  public position_set: boolean;

  public fixed = false;

  private hover = false;
  private selected = false;
  private isMaterialCloned = false;

  private dragOffset = new Vector3();
  private initialRotation = 0;
  private startDragAngle = 0;

  private highlighted = false;
  private emissiveColor = 0x444444;
  // private material: MeshFaceMaterial;

  private rotationGizmo: Mesh;
  private gizmoSizeRatio = 1.2;

  constructor(
    scene: BlueprintScene,
    furniture: Furniture,
    object: Object3D,
    position: Vector3,
    rotation: number,
    scale: Vector3
  ) {
    super();
    this.scene = scene;
    this.furniture = furniture;
    this.add(object);

    this.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(object);
    const bottomCenter = new Vector3();
    bottomCenter.x = (box.min.x + box.max.x) / 2;
    bottomCenter.y = box.min.y;
    bottomCenter.z = (box.min.z + box.max.z) / 2;
    object.position.sub(bottomCenter);

    this.position.copy(position);
    this.rotation.y = rotation;
    this.scale.copy(scale);

    this.castShadow = true;
    this.receiveShadow = false;
    this.position_set = !!position;

    // ROTATION RING
    const size = new Vector3();
    box.getSize(size);

    const radius = (Math.max(size.x, size.z) / 2) * this.gizmoSizeRatio;

    const ringGeometry = new TorusGeometry(radius, 0.05, 16, 100);
    const ringMaterial = new MeshBasicMaterial({
      color: 0x0099ff,
      transparent: true,
      opacity: 0.8,
    });
    this.rotationGizmo = new Mesh(ringGeometry, ringMaterial);

    this.rotationGizmo.rotation.x = -Math.PI / 2;
    this.rotationGizmo.position.y = 0.5;
    this.rotationGizmo.name = 'ROTATION_GIZMO';
    this.rotationGizmo.layers.set(LAYER_GIZMO);
    this.rotationGizmo.layers.disable(LAYER_FURNITURE);
    this.rotationGizmo.visible = false;
    this.add(this.rotationGizmo);
  }

  public mouseOver(state?: number): void {
    this.hover = true;
    this.updateHighlight(state);
  }

  public mouseOff() {
    this.hover = false;
    this.updateHighlight();
  }

  public setSelected() {
    this.selected = true;
    this.updateHighlight();
    this.rotationGizmo.visible = true;
    this.rotationGizmo.layers.enable(LAYER_FURNITURE);
  }

  public setUnselected() {
    this.selected = false;
    this.updateHighlight();
    this.rotationGizmo.visible = false;
    this.rotationGizmo.layers.disable(LAYER_FURNITURE);
  }

  private updateHighlight(state?: number): void {
    // TODO: Simple logic
    const on = this.hover || this.selected;
    this.highlighted = on;
    let emissiveHex = on ? this.emissiveColor : 0x000000;
    if (this.hover && !this.selected) {
      emissiveHex = 0x0000ff;
    }
    if (state === ControllerState.DELETE) {
      emissiveHex = 0xff0000;
    }

    if (on && !this.isMaterialCloned) {
      this.traverse((child) => {
        if (child instanceof Mesh) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((material) => material.clone());
          } else {
            child.material = child.material.clone();
          }
        }
      });
    }

    this.traverse((child) => {
      if (child instanceof Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if ('emissive' in material) {
              (material as MeshStandardMaterial).emissive.set(emissiveHex);
            }
          });
        } else {
          const material = child.material as MeshStandardMaterial;
          if ('emissive' in material) {
            material.emissive.set(emissiveHex);
          }
        }
      }
    });
  }

  public clickPressed(intersection: Intersection): void {
    this.dragOffset.copy(intersection.point).sub(this.position);
  }

  public clickDragged(intersection: Intersection): void {
    if (intersection) {
      this.moveToPosition(intersection.point.sub(this.dragOffset), intersection);
    }
  }

  public moveToPosition(vec3: Vector3, intersection: Intersection): void {
    this.position.copy(vec3);
  }

  public startRotation(intersection: Intersection): void {
    const itemPosition = this.position;
    const mousePosition = intersection.point;
    this.initialRotation = this.rotation.y;
    const dx = mousePosition.x - itemPosition.x;
    const dz = mousePosition.z - itemPosition.z;
    this.startDragAngle = Math.atan2(dx, dz);
  }

  public rotate(intersection: Intersection): void {
    const itemPosition = this.position;
    const mousePosition = intersection.point;

    const currentDragAngle = Math.atan2(
      mousePosition.x - itemPosition.x,
      mousePosition.z - itemPosition.z
    );
    const angleDelta = currentDragAngle - this.startDragAngle;

    const newRawRotation = this.initialRotation + angleDelta;

    const snapAngleRadians = (SNAP_ANGLE_DEGREES * Math.PI) / 180;
    const snapThresholdRadians = (SNAP_THRESHOLD_DEGREES * Math.PI) / 180;

    const snappedAngle = Math.round(newRawRotation / snapAngleRadians) * snapAngleRadians;
    const difference = Math.abs(newRawRotation - snappedAngle);

    if (difference < snapThresholdRadians) {
      this.rotation.y = snappedAngle;
    } else {
      this.rotation.y = newRawRotation;
    }
  }
}
