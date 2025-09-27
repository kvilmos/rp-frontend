import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetricPipe } from '../../../utils/metric-pipe';
import { RpValueDisplay } from '../../../shared/rp-value-display/rp-value-display';
import { MetricType } from '../../../common/type/furniture';

@Component({
  standalone: true,
  selector: 'rp-furniture-form',
  templateUrl: './furniture-form.html',
  styleUrl: './furniture-form.scss',
  imports: [
    DecimalPipe,
    FormsModule,
    MetricPipe,
    ReactiveFormsModule,
    RpButton,
    RpFileInput,
    RpTextInput,
    RpValidationError,
    RpValueDisplay,
  ],
})
export class FurnitureForm implements OnInit {
  public furnitureForm = new FormGroup({
    fileName: new FormControl({ value: '', disabled: true }),
    fileSize: new FormControl(0, [Validators.max(1000000000), Validators.required]),
    objectName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  });

  public modelWidth = signal<number | null>(null);
  public modelHeight = signal<number | null>(null);
  public modelDepth = signal<number | null>(null);
  public submitted = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly furnitureService = inject(FurnitureService);

  constructor() {}

  public ngOnInit(): void {
    this.furnitureForm.controls.fileSize.reset();

    this.furnitureService
      .getFile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file) => {
        this.furnitureForm.controls['fileName'].setValue(file?.name ?? null);
        this.furnitureForm.controls['fileSize'].setValue(file?.size ?? null);
      });

    this.furnitureService
      .getObjectData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((metadata) => {
        this.modelWidth.set(metadata?.sizeX ?? null);
        this.modelHeight.set(metadata?.sizeY ?? null);
        this.modelDepth.set(metadata?.sizeZ ?? null);
      });
  }

  public onSelectFile(file: File) {
    this.furnitureService.resetThumbnails();
    this.furnitureService.setFile(file);
  }

  public onSubmitForm(): void {
    this.submitted = true;
    if (this.furnitureForm.invalid) {
      // TODO: STORY-201 ERROR HANDLER
      return;
    }

    const objectName = this.furnitureForm.value.objectName as string;
    //const metricType = this.furnitureForm.value.objectMetricGroup as MetricType;

    const furnitureMeta: NewFurniture = {
      name: objectName,
    };

    this.furnitureService.createFurniture(furnitureMeta);
  }

  public onResetForm(): void {
    this.submitted = false;
    this.furnitureService.resetThumbnails();
    this.furnitureService.resetFile();
  }
}
