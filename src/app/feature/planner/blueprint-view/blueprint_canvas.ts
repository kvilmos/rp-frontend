import { ElementRef } from '@angular/core';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { BlueprintControl } from './blueprint_control';
import { Blueprint } from './blueprint';
import { Corner } from './corner';
import { Wall } from './wall';
import { map } from '../utils';
import { Room } from '../Room';

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

    const rooms = this.blueprint.getRooms();
    for (let i = 0; i < rooms.length; i++) {
      this.drawRoom(rooms[i]);
    }

    const walls = this.blueprint.getWalls();
    for (let i = 0; i < walls.length; i++) {
      this.drawWall(walls[i]);
    }

    const corners = this.blueprint.getCorners();
    for (var i = 0; i < corners.length; i++) {
      this.drawCorner(corners[i]);
    }
  }

  private drawGrid(): void {
    const offsetX = this.calculateGridOffset(-this.blueprintCtrl.originX);
    const offsetY = this.calculateGridOffset(-this.blueprintCtrl.originY);
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;
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

  private drawWall(wall: Wall) {
    /*
        var hover = wall === this.viewmodel.activeWall;
        var color = wallColor;
        if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
        color = deleteColor;
        } else if (hover) {
        color = wallColorHover;
        }
    */

    this.drawLine(
      this.blueprintCtrl.convertX(wall.getStartX()),
      this.blueprintCtrl.convertY(wall.getStartY()),
      this.blueprintCtrl.convertX(wall.getEndX()),
      this.blueprintCtrl.convertY(wall.getEndY()),
      BLUEPRINT.WALL_WIDTH, //hover ? wallWidthHover : wallWidth,
      BLUEPRINT.WALL_COLOR //color
    );
    /*
        if (!hover && wall.frontEdge) {
        this.drawEdge(wall.frontEdge, hover);
        }
        if (!hover && wall.backEdge) {
        this.drawEdge(wall.backEdge, hover);
        }
    */
  }

  private drawCircle(centerX: number, centerY: number, radius: number, fillColor: string) {
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
  }

  private drawRoom(room: Room) {
    // var scope = this; ?
    this.drawPolygon(
      map(room.corners, (corner: Corner) => {
        return this.blueprintCtrl.convertX(corner.x);
      }),
      map(room.corners, (corner: Corner) => {
        return this.blueprintCtrl.convertY(corner.y);
      }),
      true,
      BLUEPRINT.ROOM_COLOR
    );
  }

  private drawPolygon(
    xArr: number[],
    yArr: number[],
    fill: boolean,
    fillColor: string,
    stroke?: boolean,
    strokeColor?: string,
    strokeWidth?: number
  ) {
    // fill = fill || false;
    // stroke = stroke || false;
    this.ctx.beginPath();
    this.ctx.moveTo(xArr[0], yArr[0]);
    for (var i = 1; i < xArr.length; i++) {
      this.ctx.lineTo(xArr[i], yArr[i]);
    }
    this.ctx.closePath();
    if (fill) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    if (stroke && strokeWidth && strokeColor) {
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
  }

  public handleWindowResize(): void {
    const parent = this.canvasElement.parentElement;
    if (parent) {
      this.canvasElement.height = parent.clientHeight;
      this.canvasElement.width = parent.clientWidth;
    }
    this.draw();
  }
}
