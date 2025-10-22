import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription, switchMap } from 'rxjs';
import { FurniturePage } from '../furniture_page';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FurnitureFilters } from '../furniture_filter';

@Component({
  standalone: true,
  selector: 'rp-furniture-list',
  templateUrl: 'furniture-list.html',
  styleUrl: 'furniture-list.scss',
  imports: [RouterLink, TranslatePipe, FormsModule, ReactiveFormsModule],
})
export class RpFurnitureList implements OnInit {
  public furnitureList!: FurniturePage;
  private routeSub!: Subscription;

  public activeFilters: FurnitureFilters = {};

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  constructor() {}

  public ngOnInit(): void {
    this.routeSub = combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([params, queryParams]: [ParamMap, ParamMap]) => {
          const pageParam = params.get('page');
          const page = pageParam ? Number.parseInt(pageParam, 10) : 1;

          const sortBy = queryParams.get('sortByCreateAt');
          this.activeFilters = {
            sortByCreateAt: sortBy ? sortBy : 'latest',
          };

          return this.getFurniture(page, this.activeFilters);
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

  public getFurniture(page: number, filters: FurnitureFilters = {}): Observable<FurniturePage> {
    let params = new HttpParams();
    if (filters.sortByCreateAt) {
      params = params.append('sortByCreateAt', filters.sortByCreateAt);
    }

    return this.http.get<FurniturePage>(`/api/furniture/page/${page}`, { params });
  }

  public setSorting(sortValue: 'latest' | 'oldest' | null): void {
    const queryParams: FurnitureFilters = {};
    if (sortValue) {
      queryParams.sortByCreateAt = sortValue;
    }

    this.router.navigate(['/furniture/page', 1], { queryParams });
  }

  public ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
