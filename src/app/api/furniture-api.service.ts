import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FurnitureFilter } from '../feature/furniture/furniture_filter';
import { FurniturePage } from '../feature/furniture/furniture_page';
import { Observable } from 'rxjs';
import { FurnitureCategory } from '../feature/furniture/furniture-category.interface';
import { NewFurniture } from '../feature/furniture/new_furniture';
import { FurnitureUrls } from './furniture_urls.interface';

@Injectable({ providedIn: 'root' })
export class FurnitureApiService {
  private readonly http = inject(HttpClient);

  public requestCreateFurniture(furniture: NewFurniture): Observable<FurnitureUrls> {
    return this.http.post<FurnitureUrls>('/api/furniture', furniture);
  }

  public getAllFurniture(filters: FurnitureFilter = {}): Observable<FurniturePage> {
    const httpParams = this.buildParams(filters);
    return this.http.get<FurniturePage>('/api/furniture', { params: httpParams });
  }

  public getOwnFurniture(filters: FurnitureFilter = {}): Observable<FurniturePage> {
    const httpParams = this.buildParams(filters);
    return this.http.get<FurniturePage>('/api/profile/furniture', { params: httpParams });
  }

  public getCategories(): Observable<FurnitureCategory[]> {
    return this.http.get<FurnitureCategory[]>('/api/furniture-category');
  }

  private buildParams(filters: FurnitureFilter): HttpParams {
    let params = new HttpParams();
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.order) {
      params = params.set('order', filters.order);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }

    return params;
  }
}
