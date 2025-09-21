import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MetricType, NewFurniture } from '../newfurniture';
import { FurnitureService, ModelMeta } from '../furniture.service';
import { RpFileInput } from '../../../shared/rp-file-input/rp-file-input';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { Observable } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetricPipe } from '../../../utils/metric-pipe';
import { RpSelectInput } from '../../../shared/rp-select-input/rp-select-input';
import { RpValueDisplay } from '../../../shared/rp-value-display/rp-value-display';

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
    RpSelectInput,
    RpValidationError,
    RpValueDisplay,
  ],
})
export class FurnitureForm implements OnInit {
  public fileData$!: Observable<ModelMeta | null>;

  public furnitureForm = new FormGroup({
    fileName: new FormControl({ value: '', disabled: true }, Validators.required),
    fileSize: new FormControl(0, [Validators.max(1000000000), Validators.required]),
    objectName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    objectMetricGroup: new FormControl('', Validators.required),
  });

  public modelWidth = signal<number | undefined>(undefined);
  public modelHeight = signal<number | undefined>(undefined);
  public modelDepth = signal<number | undefined>(undefined);

  constructor(
    private readonly furnitureService: FurnitureService,
    private readonly destroyRef: DestroyRef
  ) {}

  public ngOnInit(): void {
    this.furnitureForm.controls.fileSize.reset();

    this.furnitureService.fileData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((metadata) => {
        if (metadata) {
          this.furnitureForm.controls['fileName'].setValue(metadata.file.name);
          this.furnitureForm.controls['fileSize'].setValue(metadata.file.size);

          this.modelWidth.set(metadata.sizeX);
          this.modelHeight.set(metadata.sizeY);
          this.modelDepth.set(metadata.sizeZ);
        } else {
          this.modelWidth.set(undefined);
          this.modelHeight.set(undefined);
          this.modelDepth.set(undefined);
        }
      });
  }

  public onSelectFile(file: File) {
    this.furnitureService.setSelectedFile(file);
  }

  public onSubmitFurnitureForm(): void {
    if (this.furnitureForm.invalid) {
      // TODO: STORY-201 ERROR HANDLER
      return;
    }

    const name = this.furnitureForm.value.objectName as string;
    const metricType = this.furnitureForm.value.objectMetricGroup as MetricType;

    const furnitureMeta: NewFurniture = {
      name: name,
      metricType: metricType,
    };

    this.furnitureService.requestUploadUrl(furnitureMeta);
  }

  public onResetForm(): void {
    this.furnitureService.unsetSelectedFile();
  }
}
