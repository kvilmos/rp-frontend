import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { Furniture } from '../furniture';
import { Observable, Subscription, switchMap } from 'rxjs';
import { FurniturePage } from '../furniture-page';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-furniture-list',
  templateUrl: 'furniture-list.html',
  styleUrl: 'furniture-list.scss',
  imports: [RouterLink, TranslatePipe],
})
export class rpFurnitureList {
  @Output() onSelect = new EventEmitter<Furniture>();

  public furnitureList!: FurniturePage;
  private routeSub!: Subscription;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  constructor() {}

  public ngOnInit(): void {
    this.routeSub = this.route.paramMap
      .pipe(
        switchMap((params: ParamMap) => {
          const pageParam = params.get('page');
          const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
          return this.getFurniture(page);
        })
      )
      .subscribe({
        next: (data: FurniturePage) => {
          this.furnitureList = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Hiba történt az API hívás során:', err);
        },
      });
  }

  public getFurniture(page: number): Observable<FurniturePage> {
    return this.http.get<FurniturePage>(`/api/furniture/page/${page}`);
  }

  public onSelectFurniture(furniture: Furniture) {
    this.onSelect.emit(furniture);
  }

  public ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
