import { Furniture } from './furniture';

export interface FurniturePage {
  nextPage: number;
  prevPage: number;
  currPage: number;
  totalPages: number;
  furniture: Furniture[];
}
