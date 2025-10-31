import {
  Component,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { Furniture } from '../furniture';
import { FurniturePage } from '../furniture_page';
import { FurnitureApiService } from '../furniture-api.service';
import { FurnitureFilter } from '../furniture_filter';
import { SORTING } from '../../../common/constants/list-constants';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-furniture-selector',
  templateUrl: 'furniture-selector.html',
  styleUrl: 'furniture-selector.scss',
  imports: [TranslatePipe],
})
export class RpFurnitureSelector implements OnInit, OnDestroy {
  @ViewChild('loadTrigger') loadTrigger!: ElementRef;
  @Output() onSelect = new EventEmitter<Furniture>();

  public furnitureList: Furniture[] = [];
  public loading = false;
  public hasNextPage = true;
  private currentPage = 1;

  private observerInitialized = false;
  private observer!: IntersectionObserver;

  private readonly furnitureApi = inject(FurnitureApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  constructor() {}

  public ngOnInit(): void {
    this.loadFurniture();
  }

  public setupObserver() {
    if (!this.loadTrigger || this.observerInitialized) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '150px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadFurniture();
      }
    }, options);

    this.observer.observe(this.loadTrigger.nativeElement);
    this.observerInitialized = true;
  }

  public loadFurniture(): void {
    if (this.loading || !this.hasNextPage) return;

    this.loading = true;
    const filter: FurnitureFilter = {
      page: this.currentPage,
      order: SORTING.LATEST_CREATED.value,
    };

    this.furnitureApi.getAllFurniture(filter).subscribe({
      next: (pageData: FurniturePage) => {
        if (pageData && pageData.furniture && pageData.furniture.length > 0) {
          this.furnitureList.push(...pageData.furniture);
          this.currentPage++;
          this.hasNextPage = pageData.currPage < pageData.totalPages;
        } else {
          this.hasNextPage = false;
        }

        this.loading = false;
        this.cdr.detectChanges();

        setTimeout(() => this.setupObserver(), 0);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  public onSelectFurniture(furniture: Furniture) {
    this.onSelect.emit(furniture);
  }

  public ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
