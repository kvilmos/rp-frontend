import { Routes } from '@angular/router';
import { FurnitureUpload } from './feature/furniture/furniture-upload/furniture-upload';
import { AuthPage } from './feature/auth/auth-page/auth-page';
import { Home } from './feature/home/home';
import { authGuard } from './guard/auth-guard';
import { NotFound } from './core/not-found/not-found';
import { loggedInGuard } from './guard/logged-in-guard';
import { RpBlueprintView } from './feature/planner/blueprint-view/blueprint-view';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    canActivate: [authGuard],
  },
  {
    path: 'authentication',
    component: AuthPage,
    canActivate: [loggedInGuard],
  },
  {
    path: 'furniture-upload',
    component: FurnitureUpload,
    canActivate: [authGuard],
  },
  {
    path: 'planner',
    component: RpBlueprintView,
    canActivate: [authGuard],
  },
  {
    path: '**',
    component: NotFound,
  },
];
