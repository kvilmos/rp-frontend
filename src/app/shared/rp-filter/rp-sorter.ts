import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SortOption } from '../../common/constants/list-constants';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-sorter',
  templateUrl: 'rp-sorter.html',
  styleUrl: 'rp-sorter.scss',
  imports: [FormsModule, TranslatePipe],
})
export class RpSorter {
  @Input() options: SortOption[] = [];
  @Input() currentSort: string = '';

  @Output() sortChange = new EventEmitter<string>();

  public onSelectionChange(newValue: string): void {
    this.sortChange.emit(newValue);
  }
}
