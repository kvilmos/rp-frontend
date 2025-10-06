import { Component, inject } from '@angular/core';
import { FurniturePreview } from '../furniture-preview/furniture-preview';
import { FurnitureForm } from '../furniture-form/furniture-form';
import { ThumbnailHolder } from '../thumbnail-holder/thumbnail-holder';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-furniture-upload',
  templateUrl: './furniture-upload.html',
  styleUrl: './furniture-upload.scss',
  imports: [FurniturePreview, FurnitureForm, ThumbnailHolder, FontAwesomeModule, TranslatePipe],
})
export class FurnitureUpload {
  public faArrowLeft = faArrowLeft;

  private readonly router = inject(Router);
  public onClickBack(): void {
    this.router.navigate(['']);
  }
}
