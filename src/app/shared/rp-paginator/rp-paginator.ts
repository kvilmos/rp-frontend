import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-paginator',
  templateUrl: 'rp-paginator.html',
  styleUrl: 'rp-paginator.scss',
  imports: [NgClass, TranslatePipe],
})
export class RpPaginator implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageChange = new EventEmitter<number>();

  public pages: number[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage'] || changes['totalPages']) {
      this.pages = this.generatePagesArray();
    }
  }

  private generatePagesArray(): number[] {
    const pagesToShow = 5;
    const pages: number[] = [];

    if (this.totalPages <= pagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, this.currentPage + 2);

      if (this.currentPage <= 3) {
        endPage = pagesToShow;
      }
      if (this.currentPage > this.totalPages - 3) {
        startPage = this.totalPages - pagesToShow + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  public onPageSelect(pageNumber: number): void {
    if (pageNumber === this.currentPage) return;
    this.pageChange.emit(pageNumber);
  }

  public onPrevious(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  public onNext(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}
