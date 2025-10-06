import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: true,
  selector: 'rp-thumbnail',
  templateUrl: 'rp-thumbnail.html',
  styleUrl: 'rp-thumbnail.scss',
  imports: [FontAwesomeModule],
})
export class RpThumbnail {
  @Input() imageUrl = '';
  @Output() onHearth = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();

  public hearth = faHeart;
  public trash = faTrash;

  public onClickHearth(): void {
    this.onHearth.emit();
  }

  public onClickTrash(): void {
    this.onDelete.emit();
  }
}
