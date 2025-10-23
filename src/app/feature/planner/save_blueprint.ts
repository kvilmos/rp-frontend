export interface BlueprintSave {
  id: number;
  corners: CornerSave[];
  walls: WallSave[];
  items: ItemSave[];
}

export interface CornerSave {
  id: string;
  x: number;
  y: number;
}

export interface WallSave {
  startCornerId: string;
  endCornerId: string;
}

export interface ItemSave {
  furnitureId: number;
  posX: number;
  posY: number;
  posZ: number;
  rot: number;
}
