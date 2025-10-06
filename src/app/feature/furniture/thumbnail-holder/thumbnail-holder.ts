import { Component, inject, OnInit } from '@angular/core';
import { RpThumbnail } from '../../../shared/rp-thumbnail/rp-thumbnail';
import { Observable } from 'rxjs';
import { FurnitureThumbnail } from '../furniture_thumbnail';
import { AsyncPipe } from '@angular/common';
import { FurnitureService } from '../furniture.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-thumbnail-holder',
  templateUrl: 'thumbnail-holder.html',
  styleUrl: 'thumbnail-holder.scss',
  imports: [RpThumbnail, AsyncPipe, TranslatePipe],
})
export class ThumbnailHolder {
  public thumbnails$!: Observable<FurnitureThumbnail[]>;

  private readonly furnitureService = inject(FurnitureService);
  constructor() {
    this.thumbnails$ = this.furnitureService.getThumbnails();
  }

  public removeThumbnail(id: string): void {
    this.furnitureService.unsetThumbnail(id);
  }

  public selectThumbnail(id: string): void {
    this.furnitureService.selectThumbnail(id);
  }
}
