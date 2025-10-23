import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Item } from '../planner/item';

@Injectable({ providedIn: 'root' })
export class InteractionService {
  public readonly newItemCreated$ = new BehaviorSubject<Item | null>(null);
}
