import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap } from 'rxjs';
import { BlueprintApiService } from '../blueprint-api-service';
import { BlueprintPage } from '../blueprint_load';
import { AsyncPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BlueprintFilter } from '../blueprint_filter';
import { FormsModule } from '@angular/forms';
import { SORTING, SortOption } from '../../../common/constants/list-constants';
import { RpPaginator } from '../../../shared/rp-paginator/rp-paginator';
import { RpSorter } from '../../../shared/rp-filter/rp-sorter';

@Component({
  standalone: true,
  selector: 'rp-blueprint-list',
  templateUrl: './blueprint-list.html',
  styleUrl: './blueprint-list.scss',
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    FontAwesomeModule,
    FormsModule,
    AsyncPipe,
    RpSorter,
    RpPaginator,
  ],
})
export class RpBlueprintList implements OnInit {
  public readonly iconEdit = faFilePen;
  public readonly iconDel = faTrash;
  public readonly sortingOptions: SortOption[] = [
    SORTING.RECENTLY_MODIFIED,
    SORTING.OLDEST_MODIFIED,
    SORTING.LATEST_CREATED,
    SORTING.OLDEST_CREATED,
  ];

  public pageData$!: Observable<BlueprintPage>;
  public activeFilters: BlueprintFilter = {};

  private refreshTrigger = new BehaviorSubject<void>(undefined);

  private readonly bpApi = inject(BlueprintApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  constructor() {}

  public ngOnInit(): void {
    this.pageData$ = combineLatest([
      this.route.queryParamMap,
      this.refreshTrigger.asObservable(),
    ]).pipe(
      map(([queryParams, _]) => queryParams),
      switchMap((queryParams) => {
        const pageParam = queryParams.get('page');
        const orderParam = queryParams.get('order');

        this.activeFilters = {
          page: pageParam ? Number.parseInt(pageParam, 10) : 1,
          order: orderParam || SORTING.RECENTLY_MODIFIED.value,
        };

        return this.bpApi.getUserBlueprint(this.activeFilters);
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

  public onBlueprintDelete(id: number) {
    if (!confirm('Are you sure you want to delete this blueprint?')) {
      return;
    }

    this.bpApi.deleteBlueprint(id).subscribe({
      next: () => {
        console.log('Blueprint deleted successfully. Refreshing list...');
        this.refreshTrigger.next();
      },
      error: (err) => {
        console.error('Failed to delete blueprint', err);
      },
    });
  }
}
