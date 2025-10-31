import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlueprintSave } from './save_blueprint';
import { BlueprintPage, CompleteBlueprint } from './blueprint_load';
import { BlueprintFilter } from './blueprint_filter';

@Injectable({
  providedIn: 'root',
})
export class BlueprintApiService {
  private readonly http = inject(HttpClient);
  constructor() {}

  public createBlueprint(): Observable<CompleteBlueprint> {
    return this.http.post<CompleteBlueprint>('/api/blueprint', null);
  }

  public getCompleteBlueprintById(id: number): Observable<CompleteBlueprint> {
    return this.http.get<CompleteBlueprint>(`/api/blueprint/complete/${id}`);
  }

  public uploadBlueprint(blueprint: BlueprintSave): Observable<any> {
    return this.http.put(`/api/blueprint/${blueprint.id}`, blueprint);
  }

  public getUserBlueprint(params: BlueprintFilter = {}): Observable<BlueprintPage> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page);
    }
    if (params.order) {
      httpParams = httpParams.set('order', params.order);
    }

    return this.http.get<BlueprintPage>(`/api/profile/blueprint`, { params: httpParams });
  }

  public getCompleteBlueprint(id: number): Observable<CompleteBlueprint> {
    return this.http.get<CompleteBlueprint>(`/api/blueprint/complete/${id}`);
  }

  public deleteBlueprint(id: number): Observable<any> {
    return this.http.delete(`/api/blueprint/${id}`);
  }
}
