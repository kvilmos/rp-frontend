import { Furniture } from './furniture';

export interface FurniturePage {
  nextPage: number;
  prevPage: number;
  currPage: number;
  totalPage: number;
  furniture: Furniture[];
}
