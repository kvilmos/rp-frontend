import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { CompleteBlueprint } from './blueprint_load';
import { inject } from '@angular/core';
import { BlueprintApiService } from '../../api/blueprint-api-service';

export const blueprintDataResolver: ResolveFn<CompleteBlueprint> = (
  route: ActivatedRouteSnapshot
): Observable<CompleteBlueprint> => {
  const bpApi = inject(BlueprintApiService);
  const blueprintId = +route.paramMap.get('blueprintId')!;

  return bpApi.getCompleteBlueprintById(blueprintId);
};
