import { ElementRef } from '@angular/core';
import { BlueprintCanvas } from './blueprint_canvas';
import { Blueprint } from './blueprint';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { Corner } from './corner';
import { Wall } from './wall';

export class BlueprintControl {
  public mode = BLUEPRINT.MODE_DRAW;

  public originX = 0;
  public originY = 0;

  private mouseX = 0;
  private mouseY = 0;

  private rawMouseX = 0;
  private rawMouseY = 0;

  private lastX = 0;
  private lastY = 0;

  public targetX = 0;
  public targetY = 0;

  private mouseDown = false;
  private mouseMoved = false;

  public activeWall: Wall | null = null;
  public activeCorner: Corner | null = null;
  private lastNode: Corner | null = null;

  public view: BlueprintCanvas;
  private blueprint: Blueprint;

  // Const?
  private cmPerFoot = 30.48;
  private pixelsPerFoot = 15.0;
  private cmPerPixel = this.cmPerFoot * (1.0 / this.pixelsPerFoot);
  private pixelsPerCm = 1.0 / this.cmPerPixel;

  constructor(ref: ElementRef<HTMLCanvasElement>, blueprint: Blueprint) {
    this.view = new BlueprintCanvas(ref, this, blueprint);
    this.blueprint = blueprint;

    // after load?
    this.reset();
  }

  private updateTarget() {
    if (this.mode === BLUEPRINT.MODE_DRAW && this.lastNode) {
      if (Math.abs(this.mouseX - this.lastNode.x) < BLUEPRINT.SNAP_TOLERANCE) {
        this.targetX = this.lastNode.x;
      } else {
        this.targetX = this.mouseX;
      }
      if (Math.abs(this.mouseY - this.lastNode.y) < BLUEPRINT.SNAP_TOLERANCE) {
        this.targetY = this.lastNode.y;
      } else {
        this.targetY = this.mouseY;
      }
    } else {
      this.targetX = this.mouseX;
      this.targetY = this.mouseY;
    }

    this.view.draw();
  }

  public onMouseDown(): void {
    this.mouseDown = true;
    this.mouseMoved = false;
    this.lastX = this.rawMouseX;
    this.lastY = this.rawMouseY;
  }

  public onMouseMove(event: MouseEvent): void {
    this.mouseMoved = true;

    this.rawMouseX = event.clientX;
    this.rawMouseY = event.clientY;

    this.mouseX =
      (event.clientX - this.view.canvasElement.getBoundingClientRect().left) * this.cmPerPixel +
      this.originX * this.cmPerPixel;
    this.mouseY =
      (event.clientY - this.view.canvasElement.getBoundingClientRect().top) * this.cmPerPixel +
      this.originY * this.cmPerPixel;

    if (
      this.mode === BLUEPRINT.MODE_DRAW ||
      (this.mode === BLUEPRINT.MODE_MOVE && this.mouseDown)
    ) {
      this.updateTarget();
    }

    if (this.mouseDown && !this.activeCorner && !this.activeWall) {
      this.originX += this.lastX - this.rawMouseX;
      this.originY += this.lastY - this.rawMouseY;
      this.lastX = this.rawMouseX;
      this.lastY = this.rawMouseY;
      this.view.draw();
    }
  }

  public onMouseUp(): void {
    this.mouseDown = false;

    if (this.mode === BLUEPRINT.MODE_DRAW && !this.mouseMoved) {
      const corner = this.blueprint.newCorner(this.targetX, this.targetY);
      if (this.lastNode) {
        this.blueprint.newWall(this.lastNode, corner);
      }
      if (corner.mergeWithIntersected() && this.lastNode != null) {
        console.log('merged');
        //this.setMode(floorplannerModes.MOVE);
      }

      this.lastNode = corner;
    }
  }

  private reset(): void {
    this.resetOrigin();
    this.view.draw();
  }

  private resetOrigin(): void {
    const centerX = this.view.canvasElement.clientWidth / 2.0;
    const centerY = this.view.canvasElement.clientHeight / 2.0;
    const blueprintCenter = this.blueprint.getCenter();
    this.originX = blueprintCenter.x * this.pixelsPerCm - centerX;
    this.originY = blueprintCenter.z * this.pixelsPerCm - centerY;
  }

  public convertX(x: number): number {
    return (x - this.originX * this.cmPerPixel) * this.pixelsPerCm;
  }

  public convertY(y: number): number {
    return (y - this.originY * this.cmPerPixel) * this.pixelsPerCm;
  }
}
