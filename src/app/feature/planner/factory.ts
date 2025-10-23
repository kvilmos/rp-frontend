import { FloorItem } from './floor_item';
import { Item } from './item';
import { OnFloorItem } from './on_floor_item';

export enum ItemType {
  FloorItem = 1,
  WallItem = 2,
  InWallItem = 3,
  InWallFloorItem = 7,
  OnFloorItem = 8,
  WallFloorItem = 9,
}

type ItemConstructor = new (...args: any[]) => Item;
export class Factory {
  private static readonly itemMap: Map<ItemType, ItemConstructor> = new Map([
    [ItemType.FloorItem, FloorItem],
    [ItemType.OnFloorItem, OnFloorItem],
  ]);

  public static getClass(itemType: ItemType): ItemConstructor | undefined {
    return this.itemMap.get(itemType);
  }
}
