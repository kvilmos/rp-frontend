import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription, switchMap } from 'rxjs';
import { FurniturePage } from '../furniture_page';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FurnitureFilters } from '../furniture_filter';

type FurnitureScope = 'all' | 'own';

@Component({
  standalone: true,
  selector: 'rp-furniture-list',
  templateUrl: 'furniture-list.html',
  styleUrl: 'furniture-list.scss',
  imports: [RouterLink, TranslatePipe, FormsModule, ReactiveFormsModule],
})
export class RpFurnitureList implements OnInit {
  public activeFilters: FurnitureFilters = {};
  public furnitureList!: FurniturePage;
  private dataSub!: Subscription;
  private scope: FurnitureScope = 'all';

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  constructor() {}

  public ngOnInit(): void {
    this.dataSub = combineLatest([this.route.paramMap, this.route.queryParamMap, this.route.data])
      .pipe(
        switchMap(([params, queryParams, data]) => {
          this.scope = (data['scope'] as FurnitureScope) || 'all';

          const pageParam = params.get('page');
          const page = pageParam ? Number.parseInt(pageParam, 10) : 1;

          const sortBy = queryParams.get('sortByCreateAt');
          this.activeFilters = {
            sortByCreateAt: sortBy ? sortBy : 'latest',
          };

          return this.getFurniture(page, this.activeFilters, this.scope);
        })
      )
      .subscribe({
        next: (data: FurniturePage) => {
          this.furnitureList = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  public getFurniture(
    page: number,
    filters: FurnitureFilters = {},
    scope: FurnitureScope
  ): Observable<FurniturePage> {
    let params = new HttpParams();
    if (filters.sortByCreateAt) {
      params = params.append('sortByCreateAt', filters.sortByCreateAt);
    }

    let endpoint = '';
    switch (scope) {
      case 'own':
        endpoint = `/api/profile/furniture/page/${page}`;
        break;
      default:
        endpoint = `/api/furniture/page/${page}`;
        break;
    }

    return this.http.get<FurniturePage>(endpoint, { params });
  }

  public setSorting(sortValue: 'latest' | 'oldest' | null): void {
    const queryParams: FurnitureFilters = {};
    if (sortValue) {
      queryParams.sortByCreateAt = sortValue;
    }

    this.router.navigate(['../', 1], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  public ngOnDestroy(): void {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }
}
