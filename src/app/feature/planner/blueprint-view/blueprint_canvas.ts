import { ElementRef } from '@angular/core';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { BlueprintControl } from './blueprint_control';
import { Blueprint } from './blueprint';
import { Corner } from './corner';

export class BlueprintCanvas {
  public canvasElement!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;
  private blueprintCtrl: BlueprintControl;
  private blueprint: Blueprint;

  constructor(ref: ElementRef<HTMLCanvasElement>, control: BlueprintControl, blueprint: Blueprint) {
    const ctx = ref.nativeElement.getContext('2d');
    this.blueprintCtrl = control;
    this.blueprint = blueprint;

    if (ctx) {
      this.canvasElement = ref.nativeElement;
      this.ctx = ctx;
      this.handleWindowResize();
    }
  }

  public draw(): void {
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.drawGrid();

    const corners = this.blueprint.getCorners();
    if (corners) {
      for (var i = 0; i < corners.length; i++) {
        this.drawCorner(corners[i]);
      }
    }
    //this.blueprint.getCorners().forEach((corner) => {});
  }

  private drawGrid(): void {
    var offsetX = this.calculateGridOffset(-this.blueprintCtrl.originX);
    var offsetY = this.calculateGridOffset(-this.blueprintCtrl.originY);
    var width = this.canvasElement.width;
    var height = this.canvasElement.height;
    for (var x = 0; x <= width / BLUEPRINT.GRID_SPACING; x++) {
      this.drawLine(
        BLUEPRINT.GRID_SPACING * x + offsetX,
        0,
        BLUEPRINT.GRID_SPACING * x + offsetX,
        height,
        BLUEPRINT.GRID_WIDTH,
        BLUEPRINT.GRID_COLOR
      );
    }
    for (var y = 0; y <= height / BLUEPRINT.GRID_SPACING; y++) {
      this.drawLine(
        0,
        BLUEPRINT.GRID_SPACING * y + offsetY,
        width,
        BLUEPRINT.GRID_SPACING * y + offsetY,
        BLUEPRINT.GRID_WIDTH,
        BLUEPRINT.GRID_COLOR
      );
    }
  }

  private calculateGridOffset(n: number): number {
    if (n >= 0) {
      return (
        ((n + BLUEPRINT.GRID_SPACING / 2.0) % BLUEPRINT.GRID_SPACING) - BLUEPRINT.GRID_SPACING / 2.0
      );
    } else {
      return (
        ((n - BLUEPRINT.GRID_SPACING / 2.0) % BLUEPRINT.GRID_SPACING) + BLUEPRINT.GRID_SPACING / 2.0
      );
    }
  }

  private drawLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    width: number,
    color: any
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  private drawCorner(corner: Corner) {
    /*var hover = corner === this.blueprintCtrl.activeCorner;
    var color = cornerColor;
    if (hover && this.blueprintCtrl.mode == floorplannerModes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = cornerColorHover;
    }
    */
    this.drawCircle(
      this.blueprintCtrl.convertX(corner.x),
      this.blueprintCtrl.convertY(corner.y),
      BLUEPRINT.CORNER_RADIUS, //hover ? cornerRadiusHover : cornerRadius,
      BLUEPRINT.CORNER_COLOR //color
    );
  }

  private drawCircle(centerX: number, centerY: number, radius: number, fillColor: string) {
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
  }

  public handleWindowResize(): void {
    var parent = this.canvasElement.parentElement;
    if (parent) {
      this.canvasElement.height = parent.clientHeight;
      this.canvasElement.width = parent.clientWidth;
    }
    this.draw();
  }
}
