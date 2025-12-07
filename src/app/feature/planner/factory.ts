import { FloorItem } from './floor_item';
import { Item } from './item';
import { OnFloorItem } from './on_floor_item';
import { PlaceholderItem } from './placeholder_item';

export enum ItemType {
  PlaceholderItem = 1,
  FloorItem = 2,
  OnFloorItem = 3,
}

type ItemConstructor = new (...args: any[]) => Item;
export class ItemFactory {
  private static readonly itemMap: Map<ItemType, ItemConstructor> = new Map([
    [ItemType.FloorItem, FloorItem],
    [ItemType.OnFloorItem, OnFloorItem],
    [ItemType.PlaceholderItem, PlaceholderItem],
  ]);

  public static getClass(itemType: ItemType): ItemConstructor {
    const type = this.itemMap.get(itemType);
    if (!type) {
      return PlaceholderItem;
    }

    return type;
  }
}
