import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { Furniture } from '../furniture';
import { Observable, Subscription } from 'rxjs';
import { FurniturePage } from '../furniture-page';

@Component({
  standalone: true,
  selector: 'rp-furniture-list',
  templateUrl: 'furniture-list.html',
  styleUrl: 'furniture-list.scss',
  imports: [],
})
export class rpFurnitureList {
  @Output() onSelect = new EventEmitter<Furniture>();

  public furnitureList!: FurniturePage;
  private furnitureSub!: Subscription;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  constructor() {}

  public ngOnInit(): void {
    console.log('Komponens inicializálva, most iratkozunk fel.');
    this.furnitureSub = this.getFurniture().subscribe({
      next: (data: FurniturePage) => {
        console.log('Adat sikeresen megérkezett:', data);
        this.furnitureList = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Hiba történt az API hívás során:', err);
      },
      complete: () => {
        console.log('API hívás befejeződött.');
      },
    });
  }

  private getFurniture(): Observable<FurniturePage> {
    return this.http.get<FurniturePage>('/api/furniture/page/1');
  }

  public onSelectFurniture(furniture: Furniture) {
    this.onSelect.emit(furniture);
  }

  public ngOnDestroy(): void {
    if (this.furnitureSub) {
      this.furnitureSub.unsubscribe();
    }
  }
}
