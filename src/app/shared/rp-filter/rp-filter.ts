import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { FurnitureCategory } from '../../feature/furniture/furniture-category.interface';

@Component({
  standalone: true,
  selector: 'rp-filter',
  templateUrl: 'rp-filter.html',
  styleUrl: 'rp-filter.scss',
  imports: [FormsModule, TranslatePipe],
})
export class RpFilter {
  @Input() options: FurnitureCategory[] = [];
  @Input() currentFilter: number | undefined;

  @Output() filterChange = new EventEmitter<number>();

  public onSelectionChange(newValue: number): void {
    this.filterChange.emit(newValue);
  }
}
