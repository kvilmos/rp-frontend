import { Furniture } from '../furniture/furniture';

export interface BlueprintPage {
  nextPage: number;
  prevPage: number;
  currPage: number;
  totalPages: number;
  blueprints: Blueprint[];
}
export interface Blueprint {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteBlueprint {
  id: number;
  userId: number;
  name: string;
  createAt: string;
  updateAt: string;
  corners: CornerLoad[];
  walls: WallLoad[];
  items: ItemLoad[];
  furniture: Furniture[];
}

export interface CornerLoad {
  id: string;
  x: number;
  y: number;
}

export interface WallLoad {
  id: string;
  startCornerId: string;
  endCornerId: string;
}

export interface ItemLoad {
  id: number;
  furnitureId: number;
  posX: number;
  posY: number;
  posZ: number;
  rot: number;
}
