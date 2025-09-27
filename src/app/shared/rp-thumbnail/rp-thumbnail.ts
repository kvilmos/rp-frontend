import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'rp-thumbnail',
  templateUrl: 'rp-thumbnail.html',
  styleUrl: 'rp-thumbnail.scss',
  imports: [],
})
export class RpThumbnail {
  @Input() imageUrl = '';
  @Output() delete = new EventEmitter<void>();

  public onClick(): void {
    this.delete.emit();
  }
}
