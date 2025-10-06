import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import {
  BehaviorSubject,
  EMPTY,
  fromEvent,
  map,
  Observable,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs';

@Component({
  standalone: true,
  selector: 'rp-blueprint-view',
  templateUrl: 'blueprint-view.html',
  styleUrl: 'blueprint-view.scss',
  imports: [],
})
export class RpBlueprintView implements AfterViewInit {
  @ViewChild('blueprintCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private canvasElement!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;

  private mode$ = new BehaviorSubject<number>(BLUEPRINT.MODE_MOVE);

  private originalX = 0;
  private originalY = 0;

  public ngAfterViewInit(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      this.canvasElement = this.canvasRef.nativeElement;
      this.canvasCtx = ctx;
      this.handleWindowResize();

      const pointerDown$ = fromEvent<PointerEvent>(this.canvasElement, 'pointerdown');
      const pointerMove$ = fromEvent<PointerEvent>(this.canvasElement, 'pointermove');
      const pointerUp$ = fromEvent<PointerEvent>(this.canvasElement, 'pointerup');

      const interaction$ = pointerDown$.pipe(
        withLatestFrom(this.mode$),
        switchMap(([event, mode]) => {
          switch (mode) {
            case BLUEPRINT.MODE_MOVE:
              return this.handleMoving(event, pointerMove$, pointerUp$);
            default:
              return EMPTY;
          }
        })
      );

      interaction$.subscribe((action) => {
        console.log(action);
        this.draw();
      });
    }
  }

  @HostListener('window:resize')
  public handleWindowResize() {
    var parent = this.canvasElement.parentElement;
    if (parent) {
      this.canvasElement.height = parent.clientHeight;
      this.canvasElement.width = parent.clientWidth;
    }
    this.draw();
  }

  private draw() {
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.drawGrid();
  }

  private drawGrid() {
    var offsetX = this.calculateGridOffset(-this.originalX); //this.viewmodel.originX
    var offsetY = this.calculateGridOffset(-this.originalY); //this.viewmodel.originY
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

  private calculateGridOffset(n: number) {
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
  ) {
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(startX, startY);
    this.canvasCtx.lineTo(endX, endY);
    this.canvasCtx.lineWidth = width;
    this.canvasCtx.strokeStyle = color;
    this.canvasCtx.stroke();
  }

  private handleMoving(
    startEvent: PointerEvent,
    move$: Observable<PointerEvent>,
    up$: Observable<PointerEvent>
  ) {
    const startPoint = this.getPoint(startEvent);
    return move$.pipe(
      map((moveEvent) => {
        const currentPoint = this.getPoint(moveEvent);
        this.originalX = currentPoint.x - startPoint.x;
        this.originalY = currentPoint.y - startPoint.y;
        return {
          dx: currentPoint.x - startPoint.x,
          dy: currentPoint.y - startPoint.y,
        };
      }),
      takeUntil(up$)
    );
  }

  private getPoint(event: PointerEvent): { x: number; y: number } {
    return { x: event.x, y: event.y };
  }
}
