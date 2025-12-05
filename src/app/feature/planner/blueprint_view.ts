import { ElementRef } from '@angular/core';
import { BLUEPRINT } from '../../common/constant/planner.constant';
import { BlueprintController } from './blueprint_controller';
import { Corner } from './corner';
import { Wall } from './wall';
import { Room } from './room';
import { HalfEdge } from './half_edge';
import { Blueprint } from './blueprint';
import { cmToMeasure } from './blueprint3d-utils';

export class BlueprintView {
  public canvasElement!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;
  private blueprint: Blueprint;
  private blueprintCtrl: BlueprintController;

  constructor(
    ref: ElementRef<HTMLCanvasElement>,
    control: BlueprintController,
    blueprint: Blueprint
  ) {
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
    for (let i = 0; i < corners.length; i++) {
      this.drawCorner(corners[i]);
    }

    if (this.blueprintCtrl.mode === BLUEPRINT.MODE_DRAW && this.blueprintCtrl.lastNode) {
      this.drawTarget(
        this.blueprintCtrl.targetX,
        this.blueprintCtrl.targetY,
        this.blueprintCtrl.lastNode
      );
    }

    for (let i = 0; i < walls.length; i++) {
      this.drawWallLabels(walls[i]);
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

  private drawGrid(): void {
    const offsetX = this.calculateGridOffset(-this.blueprintCtrl.originX);
    const offsetY = this.calculateGridOffset(-this.blueprintCtrl.originY);
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    for (let x = 0; x <= width / BLUEPRINT.GRID_SPACING; x++) {
      this.drawLine(
        BLUEPRINT.GRID_SPACING * x + offsetX,
        0,
        BLUEPRINT.GRID_SPACING * x + offsetX,
        height,
        BLUEPRINT.GRID_WIDTH,
        BLUEPRINT.GRID_COLOR
      );
    }

    for (let y = 0; y <= height / BLUEPRINT.GRID_SPACING; y++) {
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

  private drawRoom(room: Room) {
    this.drawPolygon(
      room.corners.map((corner) => this.blueprintCtrl.convertX(corner.x)),
      room.corners.map((corner) => this.blueprintCtrl.convertY(corner.y)),
      true,
      BLUEPRINT.ROOM_COLOR
    );
  }

  private drawWallLabels(wall: Wall) {
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance < wall.frontEdge.interiorDistance) {
        this.drawEdgeLabel(wall.backEdge);
      } else {
        this.drawEdgeLabel(wall.frontEdge);
      }
    } else if (wall.backEdge) {
      this.drawEdgeLabel(wall.backEdge);
    } else if (wall.frontEdge) {
      this.drawEdgeLabel(wall.frontEdge);
    }
  }

  private drawEdgeLabel(edge: HalfEdge) {
    var pos = edge.interiorCenter();
    var length = edge.interiorDistance();
    if (length < BLUEPRINT.LABEL_LENGTH_THRESHOLD) {
      return;
    }
    this.ctx.font = BLUEPRINT.LABEL_FONT;
    this.ctx.fillStyle = BLUEPRINT.LABEL_COLOR;
    this.ctx.textBaseline = BLUEPRINT.LABEL_BASELINE;
    this.ctx.textAlign = BLUEPRINT.LABEL_ALIGN;
    this.ctx.strokeStyle = BLUEPRINT.LABEL_STROKE_COLOR;
    this.ctx.lineWidth = BLUEPRINT.LABEL_STROKE_WIDTH;

    this.ctx.strokeText(
      cmToMeasure(length),
      this.blueprintCtrl.convertX(pos.x),
      this.blueprintCtrl.convertY(pos.y)
    );
    this.ctx.fillText(
      cmToMeasure(length),
      this.blueprintCtrl.convertX(pos.x),
      this.blueprintCtrl.convertY(pos.y)
    );
  }

  private drawWall(wall: Wall) {
    const hover = wall === this.blueprintCtrl.activeWall;
    let color = BLUEPRINT.WALL_COLOR;

    if (hover && this.blueprintCtrl.mode === BLUEPRINT.MODE_DELETE) {
      color = BLUEPRINT.DELETE_COLOR;
    } else if (hover) {
      color = BLUEPRINT.WALL_COLOR_HOVER;
    }

    this.drawLine(
      this.blueprintCtrl.convertX(wall.getStartX()),
      this.blueprintCtrl.convertY(wall.getStartY()),
      this.blueprintCtrl.convertX(wall.getEndX()),
      this.blueprintCtrl.convertY(wall.getEndY()),
      hover ? BLUEPRINT.WALL_WIDTH_HOVER : BLUEPRINT.WALL_WIDTH,
      color
    );

    if (!hover && wall.frontEdge) {
      this.drawEdge(wall.frontEdge, hover);
    }
    if (!hover && wall.backEdge) {
      this.drawEdge(wall.backEdge, hover);
    }
  }

  private drawEdge(edge: HalfEdge, hover: boolean) {
    let color = BLUEPRINT.EDGE_COLOR;
    if (hover && this.blueprintCtrl.mode === BLUEPRINT.MODE_DELETE) {
      color = BLUEPRINT.DELETE_COLOR;
    }

    const corners = edge.corners() as Corner[];
    this.drawPolygon(
      corners.map((corner) => this.blueprintCtrl.convertX(corner.x)),
      corners.map((corner) => this.blueprintCtrl.convertY(corner.y)),
      false,
      undefined,
      true,
      color,
      BLUEPRINT.EDGE_WIDTH
    );
  }

  private drawCorner(corner: Corner) {
    const hover = corner === this.blueprintCtrl.activeCorner;
    let color = BLUEPRINT.CORNER_COLOR;
    let width = BLUEPRINT.CORNER_RADIUS;
    if (hover && this.blueprintCtrl.mode === BLUEPRINT.MODE_DELETE) {
      color = BLUEPRINT.DELETE_COLOR;
    } else if (hover) {
      color = BLUEPRINT.CORNER_COLOR_HOVER;
      width = BLUEPRINT.CORNER_RADIUS_HOVER;
    }
    // corner edge
    this.drawCircle(
      this.blueprintCtrl.convertX(corner.x),
      this.blueprintCtrl.convertY(corner.y),
      width + 1,
      BLUEPRINT.EDGE_COLOR
    );

    this.drawCircle(
      this.blueprintCtrl.convertX(corner.x),
      this.blueprintCtrl.convertY(corner.y),
      width,
      color
    );
  }

  private drawCircle(centerX: number, centerY: number, radius: number, fillColor: string) {
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
  }

  private drawTarget(x: number, y: number, lastNode: Corner) {
    this.drawCircle(
      this.blueprintCtrl.convertX(x),
      this.blueprintCtrl.convertY(y),
      BLUEPRINT.CORNER_RADIUS_HOVER,
      BLUEPRINT.CORNER_COLOR_HOVER
    );
    if (this.blueprintCtrl.lastNode) {
      this.drawLine(
        this.blueprintCtrl.convertX(lastNode.x),
        this.blueprintCtrl.convertY(lastNode.y),
        this.blueprintCtrl.convertX(x),
        this.blueprintCtrl.convertY(y),
        BLUEPRINT.WALL_WIDTH_HOVER,
        BLUEPRINT.WALL_COLOR_HOVER
      );
    }
  }

  private drawPolygon(
    xArr: number[],
    yArr: number[],
    fill: boolean,
    fillColor?: string,
    stroke?: boolean,
    strokeColor?: string,
    strokeWidth?: number
  ) {
    this.ctx.beginPath();
    this.ctx.moveTo(xArr[0], yArr[0]);
    for (let i = 1; i < xArr.length; i++) {
      this.ctx.lineTo(xArr[i], yArr[i]);
    }
    this.ctx.closePath();
    if (fill && fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    if (stroke && strokeWidth && strokeColor) {
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
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

  public handleWindowResize(): void {
    const parent = this.canvasElement.parentElement;
    if (parent) {
      this.canvasElement.height = parent.clientHeight;
      this.canvasElement.width = parent.clientWidth;
    }
    this.draw();
  }
}
