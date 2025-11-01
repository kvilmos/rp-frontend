import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-upload-overlay',
  templateUrl: 'upload-overlay.html',
  styleUrl: 'upload-overlay.scss',
  imports: [CommonModule, TranslateModule],
})
export class RpUploadOverlay {
  @Input() progress: number = 0;
}
