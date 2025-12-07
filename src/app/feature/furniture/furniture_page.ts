import { Furniture } from './furniture';

export interface FurniturePage {
  currPage: number;
  totalPages: number;
  furniture: Furniture[];
}
