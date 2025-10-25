import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlueprintSave } from './save_blueprint';
import { BlueprintPage, CompleteBlueprint } from './blueprint_load';

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

  public pageBlueprint(page: number): Observable<BlueprintPage> {
    return this.http.get<BlueprintPage>(`/api/blueprint/page/${page}`);
  }

  public getCompleteBlueprint(id: number): Observable<CompleteBlueprint> {
    return this.http.get<CompleteBlueprint>(`/api/blueprint/complete/${id}`);
  }
}
