import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { Subscription, combineLatest, switchMap } from 'rxjs';
import { BlueprintApiService } from '../blueprint-api-service';
import { BlueprintPage } from '../blueprint_load';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: true,
  selector: 'rp-blueprint-list',
  templateUrl: './blueprint-list.html',
  styleUrl: './blueprint-list.scss',
  imports: [RouterLink, DatePipe, TranslatePipe, FontAwesomeModule],
})
export class RpBlueprintList implements OnInit {
  public iconEdit = faFilePen;
  public iconDel = faTrash;

  public pageData!: BlueprintPage;
  private routeSub!: Subscription;

  private readonly bpApi = inject(BlueprintApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  constructor() {}

  public ngOnInit(): void {
    this.routeSub = combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([params]: [ParamMap, ParamMap]) => {
          const pageParam = params.get('page');
          const page = pageParam ? Number.parseInt(pageParam, 10) : 1;

          return this.bpApi.pageBlueprint(page);
        })
      )
      .subscribe({
        next: (data: BlueprintPage) => {
          this.pageData = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  public ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
