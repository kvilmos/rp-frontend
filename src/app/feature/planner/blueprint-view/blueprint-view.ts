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
  faCouch,
  faCube,
  faEraser,
  faHammer,
  faPencil,
  faPenRuler,
  faSave,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { DesignBuilder } from '../designe_builder';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { Furniture } from '../../furniture/furniture';
import { BlueprintScene } from '../blueprint_scene';
import { Vector3 } from 'three';
import { PlaceholderItem } from '../placeholder_item';
import { ControllerState, DesignController } from '../builder_controller';
import { RpFurnitureSelector } from '../../furniture/furniture-selector/furniture-selector';

@Component({
  standalone: true,
  selector: 'rp-blueprint-view',
  templateUrl: 'blueprint-view.html',
  styleUrl: 'blueprint-view.scss',
  imports: [FontAwesomeModule, NgClass, TranslatePipe, RpFurnitureSelector, RouterLink],
})
export class RpBlueprintView implements AfterViewInit {
  @ViewChild('blueprintCanvas') private bpCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('designCanvas') private designCanvasRef!: ElementRef<HTMLCanvasElement>;

  public showBp = true;

  public iconBack = faArrowLeft;

  public iconView = faCube;
  public iconDeleteBp = faTrashAlt;
  public iconSave = faSave;

  public iconMove = faArrowsUpDownLeftRight;
  public iconDraw = faPencil;
  public iconDelWalls = faEraser;

  public iconBlueprint = faPenRuler;
  public iconDesign = faCouch;
  public iconDelItem = faHammer;

  public modeMove = BLUEPRINT.MODE_MOVE;
  public modeDraw = BLUEPRINT.MODE_DRAW;
  public modeDelete = BLUEPRINT.MODE_DELETE;

  public designMove = ControllerState.UNSELECTED;
  public designDelete = ControllerState.DELETE;

  public readonly bpController = inject(BlueprintController);
  private readonly bpScene = inject(BlueprintScene);

  public readonly designController = inject(DesignController);
  private readonly designBuilder = inject(DesignBuilder);

  private readonly router = inject(Router);
  constructor() {}

  public ngAfterViewInit(): void {
    this.bpController.init(this.bpCanvasRef);
    this.designBuilder.init(this.designCanvasRef);
    this.designController.init(
      this.designCanvasRef,
      this.designBuilder.renderer,
      this.designBuilder.camera,
      this.designBuilder.cameraController
    );
  }

  public setMode(mode: number): void {
    this.bpController.setMode(mode);
    if (!this.showBp) {
      this.setView();
    }
  }

  public setDesignSate(state: ControllerState) {
    this.designController.switchState(state);
  }

  public setView(): void {
    this.showBp = !this.showBp;
    setTimeout(() => {
      this.handleWindowResize();
    }, 0);
  }

  public async onSelectFurniture(furniture: Furniture): Promise<void> {
    if (this.showBp) {
      this.setView();
    }
    this.setDesignSate(this.designMove);

    const initialPosition = new Vector3(0, 0, 0);
    const placeholderItem = new PlaceholderItem(this.bpScene, initialPosition);
    this.bpScene.add(placeholderItem);
    this.bpScene.getItems().push(placeholderItem);

    try {
      const finalItem = await this.bpScene.addItem(
        8,
        furniture,
        placeholderItem.position,
        placeholderItem.rotation.y,
        new Vector3(100, 100, 100)
      );

      finalItem.position.copy(placeholderItem.position);
      finalItem.rotation.copy(placeholderItem.rotation);

      // TODO: Add some kind of state management like subscriber
      /*
      if (this.designController.selectedObject === placeholderItem) {
        this.designController.setSelectedObject(finalItem);
      }
      */

      this.bpScene.removeItem(placeholderItem);
    } catch (error) {
      console.error(error);
      placeholderItem.setError();
    }
  }

  @HostListener('window:resize')
  public handleWindowResize() {
    this.bpController.view.handleWindowResize();
    this.designBuilder.handleResize();
  }
}
