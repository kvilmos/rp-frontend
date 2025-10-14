import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
} from '@angular/core';
import { BlueprintController } from '../blueprint_controller';
import {
  faArrowLeft,
  faArrowsUpDownLeftRight,
  faCube,
  faHammer,
  faPenRuler,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { DesignBuilder } from '../designe_builder';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'rp-blueprint-view',
  templateUrl: 'blueprint-view.html',
  styleUrl: 'blueprint-view.scss',
  imports: [FontAwesomeModule, NgClass, TranslatePipe],
})
export class RpBlueprintView implements AfterViewInit {
  @ViewChild('blueprintCanvas') private bpCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('designCanvas') private designCanvasRef!: ElementRef<HTMLCanvasElement>;

  public is3dViewMain = false;

  public iconBack = faArrowLeft;
  public iconMove = faArrowsUpDownLeftRight;
  public iconDraw = faPenRuler;
  public iconDelete = faHammer;
  public iconDesign = faCube;

  public modeMove = BLUEPRINT.MODE_MOVE;
  public modeDraw = BLUEPRINT.MODE_DRAW;
  public modeDelete = BLUEPRINT.MODE_DELETE;

  private readonly bpBuilder = inject(DesignBuilder);
  public readonly bpController = inject(BlueprintController);
  private readonly router = inject(Router);
  constructor() {}

  public onClickBack(): void {
    this.router.navigate(['']);
  }

  public ngAfterViewInit(): void {
    this.bpController.init(this.bpCanvasRef);
    this.bpBuilder.init(this.designCanvasRef);
  }

  public setMode(mode: number): void {
    this.bpController.setMode(mode);
  }

  public setView(): void {
    this.is3dViewMain = !this.is3dViewMain;
    this.handleWindowResize();
  }

  @HostListener('window:resize')
  public handleWindowResize() {
    this.bpController.view.handleWindowResize();
    this.bpBuilder.handleResize();
  }
}
