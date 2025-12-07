import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlueprintFilter } from '../feature/planner/blueprint_filter';
import { CompleteBlueprint, BlueprintPage } from '../feature/planner/blueprint_load';
import { BlueprintSave } from '../feature/planner/save_blueprint';

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

  public updateBlueprint(blueprint: BlueprintSave): Observable<any> {
    return this.http.put(`/api/blueprint/${blueprint.id}`, blueprint);
  }

  public getUserBlueprint(params: BlueprintFilter = {}): Observable<BlueprintPage> {
    const httpParams = this.buildParams(params);
    return this.http.get<BlueprintPage>(`/api/profile/blueprint`, { params: httpParams });
  }

  public getCompleteBlueprint(id: number): Observable<CompleteBlueprint> {
    return this.http.get<CompleteBlueprint>(`/api/blueprint/complete/${id}`);
  }

  public deleteBlueprint(id: number): Observable<any> {
    return this.http.delete(`/api/blueprint/${id}`);
  }

  private buildParams(filters: BlueprintFilter): HttpParams {
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
