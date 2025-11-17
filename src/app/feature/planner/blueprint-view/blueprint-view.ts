import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
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
import { BLUEPRINT } from '../../../common/constants/planner-constants';
import { DesignBuilder } from '../design_builder';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Furniture } from '../../furniture/furniture';
import { BlueprintScene } from '../blueprint_scene';
import { Vector3 } from 'three';
import { ControllerState } from '../builder_controller';
import { RpFurnitureSelector } from '../../furniture/furniture-selector/furniture-selector';
import { BlueprintApiService } from '../blueprint-api-service';
import { Blueprint } from '../blueprint';
import { CompleteBlueprint } from '../blueprint_load';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CornerSave, WallSave, ItemSave, BlueprintSave } from '../save_blueprint';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ErrorHandler } from '../../../common/error/error-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_SUCCESS_CLASS,
} from '../../../common/constants/common.constant';
import { ErrorDisplay } from '../../../common/error/error.interface';

@Component({
  standalone: true,
  selector: 'rp-blueprint-view',
  templateUrl: 'blueprint-view.html',
  styleUrl: 'blueprint-view.scss',
  imports: [
    ReactiveFormsModule,
    FontAwesomeModule,
    NgClass,
    TranslatePipe,
    RpFurnitureSelector,
    RouterLink,
    RpTextInput,
  ],
})
export class RpBlueprintView implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('blueprintCanvas') private bpCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('designCanvas') private designCanvasRef!: ElementRef<HTMLCanvasElement>;

  public blueprintForm = new FormGroup({
    name: new FormControl(''),
  });
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

  public bpMove = BLUEPRINT.MODE_MOVE;
  public bpDraw = BLUEPRINT.MODE_DRAW;
  public bpDel = BLUEPRINT.MODE_DELETE;
  public designMove = ControllerState.UNSELECTED;
  public designDelete = ControllerState.DELETE;

  public activeBpTool!: number;
  public activeDesignTool!: ControllerState;

  public serverErrors: WritableSignal<ErrorDisplay[]> = signal([]);

  public readonly bpController = inject(BlueprintController);
  public readonly designBuilder = inject(DesignBuilder);

  private isViewInitialized = false;
  private blueprintData: CompleteBlueprint | undefined;
  private readonly bpScene = inject(BlueprintScene);
  private readonly blueprint = inject(Blueprint);
  private readonly bpApi = inject(BlueprintApiService);
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  constructor() {
    this.activeBpTool = this.bpController.mode;
    this.activeDesignTool = this.designBuilder.getDesignTool();
  }

  public ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.blueprintData = data['blueprint'];
      if (this.blueprintData) {
        this.blueprintForm.controls.name.setValue(this.blueprintData.name);
        if (this.isViewInitialized) {
          this.initializeFullScene();
        }
      }
    });
  }

  public ngAfterViewInit(): void {
    this.designBuilder.start(this.designCanvasRef);
    this.bpController.init(this.bpCanvasRef);
    this.isViewInitialized = true;

    if (this.blueprintData) {
      this.initializeFullScene();
    }
  }

  private async initializeFullScene(): Promise<void> {
    if (!this.blueprintData) {
      return;
    }

    this.blueprint.loadBlueprint(this.blueprintData);
    await this.bpScene.loadItems(this.blueprintData);

    this.bpController.view.draw();
  }

  public setBlueprintTool(mode: number): void {
    this.bpController.setMode(mode);
    this.activeBpTool = this.bpController.mode;
    if (!this.showBp) {
      this.setView();
    }
  }

  public setDesignTool(state: ControllerState) {
    this.designBuilder.setDesignTool(state);
    this.activeDesignTool = this.designBuilder.getDesignTool();
    if (this.showBp) {
      this.setView();
    }
  }

  public setView(): void {
    this.showBp = !this.showBp;
    requestAnimationFrame(() => {
      this.handleWindowResize();
    });
  }

  public async onSelectFurniture(furniture: Furniture): Promise<void> {
    if (this.showBp) {
      this.setView();
    }
    this.setDesignTool(this.designMove);

    try {
      await this.bpScene.addItem(3, furniture, new Vector3(), 0, new Vector3(100, 100, 100));
    } catch (error) {
      throw console.error(error);
    }
  }

  public saveBlueprint(): void {
    if (!this.blueprint.id) {
      throw console.error('Cannot save blueprint without an ID!');
    }

    const corners = this.blueprint
      .getCorners()
      .map((c): CornerSave => ({ id: c.id, x: c.x, y: c.y }));

    const walls = this.blueprint
      .getWalls()
      .map((w): WallSave => ({ startCornerId: w.getStartId(), endCornerId: w.getEndId() }));

    const items = this.bpScene.getItems().map(
      (i): ItemSave => ({
        furnitureId: i.furniture.id,
        posX: i.position.x,
        posY: i.position.y,
        posZ: i.position.z,
        rot: i.rotation.y,
      })
    );

    const name = this.blueprintForm.controls.name.getRawValue() ?? '';
    const saveBp: BlueprintSave = {
      id: this.blueprint.id,
      name: name,
      corners: corners,
      walls: walls,
      items: items,
    };

    this.bpApi.uploadBlueprint(saveBp).subscribe({
      next: () => {},
      error: (error) => {
        throw console.error(error);
      },
    });
  }

  public deleteBlueprint(): void {
    if (!this.blueprintData) {
      return;
    }

    this.translate
      .get('confirm.deleteBlueprint', {
        blueprintId: this.blueprintData.id,
        blueprintName: this.blueprintData.name,
      })
      .subscribe((confirmStr: string) => {
        if (confirm(confirmStr)) {
          this.bpApi.deleteBlueprint(this.blueprintData!.id).subscribe({
            next: () => {
              this.translate.get('server.success.deleteBlueprint').subscribe((message: string) => {
                this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
                  duration: SNACKBAR_DURATION,
                  panelClass: SNACKBAR_SUCCESS_CLASS,
                });
              });
              this.router.navigate(['/home']);
            },
            error: (err) => {
              this.serverErrors.set(this.errorHandler.processHttpError(err));
            },
          });
        }
      });
  }

  @HostListener('window:resize')
  public handleWindowResize() {
    this.bpController.view.handleWindowResize();
    this.designBuilder.handleResize();
  }

  public ngOnDestroy(): void {
    this.designBuilder.stop();
    this.blueprint.clear();
    this.bpScene.clear();
  }
}
