import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap } from 'rxjs';
import { BlueprintApiService } from '../blueprint-api-service';
import { Blueprint, BlueprintPage } from '../blueprint_load';
import { AsyncPipe, DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BlueprintFilter } from '../blueprint_filter';
import { FormsModule } from '@angular/forms';
import { SORTING, SortOption } from '../../../common/constants/list-constants';
import { RpPaginator } from '../../../shared/rp-paginator/rp-paginator';
import { RpSorter } from '../../../shared/rp-sorter/rp-sorter';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_SUCCESS_CLASS,
} from '../../../common/constants/common.constant';
import { ErrorDisplay } from '../../../common/error/error.interface';
import { ErrorHandler } from '../../../common/error/error-handler.service';

@Component({
  standalone: true,
  selector: 'rp-blueprint-list',
  templateUrl: './blueprint-list.html',
  styleUrl: './blueprint-list.scss',
  imports: [
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

  public serverErrors: WritableSignal<ErrorDisplay[]> = signal([]);
  public pageData$!: Observable<BlueprintPage>;
  public activeFilters: BlueprintFilter = {};

  private refreshTrigger = new BehaviorSubject<void>(undefined);

  private readonly bpApi = inject(BlueprintApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
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

  public onBlueprintDelete(blueprint: Blueprint) {
    this.translate
      .get('confirm.deleteBlueprint', {
        blueprintId: blueprint.id,
        blueprintName: blueprint.name,
      })
      .subscribe((confirmStr: string) => {
        if (confirm(confirmStr)) {
          this.bpApi.deleteBlueprint(blueprint.id).subscribe({
            next: () => {
              this.translate.get('server.success.deleteBlueprint').subscribe((message: string) => {
                this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
                  duration: SNACKBAR_DURATION,
                  panelClass: SNACKBAR_SUCCESS_CLASS,
                });
              });
              this.refreshTrigger.next();
            },
            error: (err) => {
              this.serverErrors.set(this.errorHandler.processHttpError(err));
            },
          });
        }
      });
  }

  public onBlueprintEdit(blueprint: Blueprint) {
    this.translate
      .get('confirm.editBlueprint', {
        blueprintId: blueprint.id,
        blueprintName: blueprint.name,
      })
      .subscribe((confirmStr: string) => {
        if (confirm(confirmStr)) {
          this.router.navigate(['/room-editor', blueprint.id]);
        }
      });
  }
}
