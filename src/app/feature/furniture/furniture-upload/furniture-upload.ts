import { Component, inject, OnDestroy } from '@angular/core';
import { FurniturePreview } from '../furniture-preview/furniture-preview';
import { FurnitureForm } from '../furniture-form/furniture-form';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FurnitureService } from '../furniture.service';
import { RpUploadOverlay } from '../upload-overlay/upload-overlay';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'rp-furniture-upload',
  templateUrl: './furniture-upload.html',
  styleUrl: './furniture-upload.scss',
  imports: [
    RpUploadOverlay,
    RouterLink,
    FurniturePreview,
    FurnitureForm,
    FontAwesomeModule,
    TranslatePipe,
    AsyncPipe,
  ],
})
export class FurnitureUpload implements OnDestroy {
  public iconBack = faArrowLeft;

  public readonly isUploading$: Observable<boolean>;
  public readonly uploadProgress$: Observable<number>;

  private readonly furnitureService = inject(FurnitureService);

  constructor() {
    this.isUploading$ = this.furnitureService.isUploading$;
    this.uploadProgress$ = this.furnitureService.uploadProgress$;
  }

  public ngOnDestroy(): void {
    this.furnitureService.reset();
  }
}
