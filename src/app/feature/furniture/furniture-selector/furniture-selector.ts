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
  AfterViewInit,
} from '@angular/core';
import { Furniture } from '../furniture';
import { FurniturePage } from '../furniture_page';
import { FurnitureApiService } from '../../../api/furniture-api.service';
import { FurnitureFilter } from '../furniture_filter';
import { SORTING } from '../../../common/constants/list-constants';
import { TranslatePipe } from '@ngx-translate/core';
import { FurnitureCategory } from '../furniture-category.interface';
import { Observable } from 'rxjs';
import { RpFilter } from '../../../shared/rp-filter/rp-filter';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'rp-furniture-selector',
  templateUrl: 'furniture-selector.html',
  styleUrl: 'furniture-selector.scss',
  imports: [TranslatePipe, AsyncPipe, RpFilter],
})
export class RpFurnitureSelector implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('loadTrigger') loadTrigger!: ElementRef;
  @Output() onSelect = new EventEmitter<Furniture>();

  public categories$!: Observable<FurnitureCategory[]>;
  public activeFilters: FurnitureFilter = {
    page: 1,
    order: SORTING.LATEST_CREATED.value,
    category: undefined,
  };
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
    this.categories$ = this.furnitureApi.getCategories();
    this.loadFurniture();
  }

  public ngAfterViewInit(): void {
    this.setupObserver();
  }

  private setupObserver() {
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

    this.furnitureApi.getAllFurniture(this.activeFilters).subscribe({
      next: (pageData: FurniturePage) => {
        if (pageData && pageData.furniture) {
          if (this.activeFilters.page === 1) {
            this.furnitureList = pageData.furniture;
          } else {
            this.furnitureList.push(...pageData.furniture);
          }

          this.activeFilters.page!++;
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

  public onCategoryFilterChange(newCategory?: number): void {
    this.activeFilters.category = newCategory;
    this.activeFilters.page = 1;
    this.furnitureList = [];
    this.hasNextPage = true;
    this.loading = false;

    this.loadFurniture();
  }

  public ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
