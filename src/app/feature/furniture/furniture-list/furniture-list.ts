import { Component, inject, OnInit } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { FurniturePage } from '../furniture_page';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FurnitureFilter } from '../furniture_filter';
import { SortOption, SORTING } from '../../../common/constants/list-constants';
import { FurnitureApiService } from '../furniture-api.service';
import { RpSorter } from '../../../shared/rp-filter/rp-sorter';
import { RpPaginator } from '../../../shared/rp-paginator/rp-paginator';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-furniture-list',
  templateUrl: 'furniture-list.html',
  styleUrl: 'furniture-list.scss',
  imports: [RpSorter, RpPaginator, AsyncPipe, FormsModule, TranslatePipe],
})
export class RpFurnitureList implements OnInit {
  public readonly sortingOptions: SortOption[] = [SORTING.LATEST_CREATED, SORTING.OLDEST_CREATED];

  public pageData$!: Observable<FurniturePage>;
  public activeFilters: FurnitureFilter = {};

  private mode: 'all' | 'own' = 'all';

  private readonly furnitureApi = inject(FurnitureApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  constructor() {}

  public ngOnInit(): void {
    if (this.router.url.includes('/profile/')) {
      this.mode = 'own';
    } else {
      this.mode = 'all';
    }

    this.pageData$ = this.route.queryParamMap.pipe(
      switchMap((queryParams) => {
        const pageParam = queryParams.get('page');
        const orderParam = queryParams.get('order');
        this.activeFilters = {
          page: pageParam ? Number.parseInt(pageParam, 10) : 1,
          order: orderParam || SORTING.LATEST_CREATED.value,
        };

        if (this.mode === 'own') {
          return this.furnitureApi.getOwnFurniture(this.activeFilters);
        } else {
          return this.furnitureApi.getAllFurniture(this.activeFilters);
        }
      })
    );
  }

  public onSortChange(newOrder: string): void {
    this.updateUrl({ order: newOrder, page: 1 });
  }

  public onPageChange(newPageNumber: number): void {
    this.updateUrl({ page: newPageNumber });
  }

  private updateUrl(newParams: { page?: number; order?: string }): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge',
    });
  }
}
