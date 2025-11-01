import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FurnitureFilter } from './furniture_filter';
import { FurniturePage } from './furniture_page';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FurnitureApiService {
  private readonly http = inject(HttpClient);

  public getAllFurniture(filters: FurnitureFilter = {}): Observable<FurniturePage> {
    const httpParams = this.buildParams(filters);
    return this.http.get<FurniturePage>('/api/furniture', { params: httpParams });
  }

  public getOwnFurniture(filters: FurnitureFilter = {}): Observable<FurniturePage> {
    const httpParams = this.buildParams(filters);
    return this.http.get<FurniturePage>('/api/profile/furniture', { params: httpParams });
  }

  private buildParams(filters: FurnitureFilter): HttpParams {
    let params = new HttpParams();
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.order) {
      params = params.set('order', filters.order);
    }

    return params;
  }
}
