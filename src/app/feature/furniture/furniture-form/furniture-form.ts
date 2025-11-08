import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewFurniture } from '../new_furniture';
import { FurnitureService } from '../furniture.service';
import { RpFileInput } from '../../../shared/rp-file-input/rp-file-input';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetricPipe } from '../../../utils/metric-pipe';
import { RpValueDisplay } from '../../../shared/rp-value-display/rp-value-display';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorHandler } from '../../../core/error/error-handler.service';
import { PreviewService } from '../preview.service';
import { THUMBNAIL } from '../../../common/constants/file-constants';
import { FurnitureCategory } from '../furniture-category.interface';
import { Observable } from 'rxjs';
import { FurnitureApiService } from '../furniture-api.service';

@Component({
  standalone: true,
  selector: 'rp-furniture-form',
  templateUrl: './furniture-form.html',
  styleUrl: './furniture-form.scss',
  imports: [
    AsyncPipe,
    DecimalPipe,
    FormsModule,
    MetricPipe,
    ReactiveFormsModule,
    RpButton,
    RpFileInput,
    RpTextInput,
    RpValidationError,
    RpValueDisplay,
    TranslatePipe,
  ],
})
export class FurnitureForm implements OnInit, AfterViewInit {
  @ViewChild('thumbnailCanvas', { static: true })
  private thumbCanvasRef!: ElementRef<HTMLCanvasElement>;
  public categories$!: Observable<FurnitureCategory[]>;

  public furnitureForm = new FormGroup({
    fileName: new FormControl({ value: '', disabled: true }),
    fileSize: new FormControl(0, [Validators.max(1000000000), Validators.required]),
    objectName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    thumbnails: new FormControl('', [Validators.required]),
    category: new FormControl(null, [Validators.required]),
  });

  public modelWidth = signal<number | null>(null);
  public modelHeight = signal<number | null>(null);
  public modelDepth = signal<number | null>(null);
  public submitted = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly furnitureApi = inject(FurnitureApiService);
  private readonly furnitureService = inject(FurnitureService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly previewService = inject(PreviewService);
  constructor() {}

  public ngAfterViewInit(): void {
    this.previewService.initThumbnail(this.thumbCanvasRef);
  }

  public ngOnInit(): void {
    this.furnitureForm.controls.fileSize.reset();
    this.categories$ = this.furnitureApi.getCategories();

    this.furnitureService.file$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((file) => {
      this.furnitureForm.controls['fileName'].setValue(file?.name ?? null);
      this.furnitureForm.controls['fileSize'].setValue(file?.size ?? null);
    });
    this.furnitureService.objectData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((metadata) => {
        this.modelWidth.set(metadata?.sizeX ?? null);
        this.modelHeight.set(metadata?.sizeY ?? null);
        this.modelDepth.set(metadata?.sizeZ ?? null);
      });
    this.furnitureService.selectedThumbnail$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((thumbnail) => {
        this.furnitureForm.controls['thumbnails'].setValue(thumbnail?.id ?? null);
      });
  }

  public onSelectFile(file: File) {
    this.onResetForm();
    this.furnitureService.setFile(file);
  }

  private async createThumbnail(): Promise<void> {
    const thumbnail = await this.previewService.createThumbnail(THUMBNAIL.WIDTH, THUMBNAIL.HIGHT);
    this.furnitureService.setThumbnail(thumbnail);
  }

  public async onSubmitForm(): Promise<void> {
    await this.createThumbnail();
    this.submitted = true;
    if (this.furnitureForm.invalid) {
      return;
    }

    const objectName = this.furnitureForm.value.objectName as string;
    const categoryId = Number.parseInt(this.furnitureForm.value.category ?? '1');

    const furnitureMeta: NewFurniture = {
      name: objectName,
      categoryId: categoryId,
      sizeX: this.modelWidth() ?? 0.5,
      sizeY: this.modelHeight() ?? 0.5,
      sizeZ: this.modelDepth() ?? 0.5,
    };

    this.furnitureService.createFurniture(furnitureMeta).catch((error) => {
      this.errorHandler.handleHttpError(error);
    });
  }

  public onResetForm(): void {
    this.submitted = false;
    this.furnitureService.reset();
  }

  @HostListener('window:resize')
  public onResizeBrowser(): void {
    this.previewService.onResizeBrowser();
  }
}
