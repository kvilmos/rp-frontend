import { HttpClient } from '@angular/common/http';
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
import { Observable } from 'rxjs';
import { Furniture } from '../furniture';
import { FurniturePage } from '../furniture-page';

@Component({
  standalone: true,
  selector: 'rp-furniture-selector',
  templateUrl: 'furniture-selector.html',
  styleUrl: 'furniture-selector.scss',
  imports: [],
})
export class RpFurnitureSelector implements OnInit, OnDestroy {
  @ViewChild('loadTrigger') loadTrigger!: ElementRef;
  @Output() onSelect = new EventEmitter<Furniture>();

  public pageData!: FurniturePage;
  public furnitureList: Furniture[] = [];

  public hasNextPage = true;
  public loading = false;
  private page = 1;

  private observerInitialized = false;
  private observer!: IntersectionObserver;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  constructor() {}

  public ngOnInit(): void {
    this.loadFurniture();
  }

  public ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
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
    this.getFurniture(this.page).subscribe({
      next: (data: FurniturePage) => {
        if (data && data.furniture && data.furniture.length > 0) {
          this.pageData = data;
          this.furnitureList.push(...data.furniture);
          this.page++;
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

  public getFurniture(page: number): Observable<FurniturePage> {
    return this.http.get<FurniturePage>(`/api/furniture/page/${page}`);
  }

  public onSelectFurniture(furniture: Furniture) {
    this.onSelect.emit(furniture);
  }
}
