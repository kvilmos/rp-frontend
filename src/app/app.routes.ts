import { Routes } from '@angular/router';
import { FurnitureUpload } from './feature/furniture/furniture-upload/furniture-upload';
import { AuthPage } from './feature/auth/auth-page/auth-page';
import { Home } from './feature/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'signup',
    component: AuthPage,
  },
  {
    path: 'furniture-upload',
    component: FurnitureUpload,
  },
];
