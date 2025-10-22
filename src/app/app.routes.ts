import { Routes } from '@angular/router';
import { FurnitureUpload } from './feature/furniture/furniture-upload/furniture-upload';
import { AuthPage } from './feature/auth/auth-page/auth-page';
import { Home } from './feature/home/home';
import { authGuard } from './guard/auth-guard';
import { NotFound } from './core/not-found/not-found';
import { loggedInGuard } from './guard/logged-in-guard';
import { RpBlueprintView } from './feature/planner/blueprint-view/blueprint-view';
import { rpFurnitureList } from './feature/furniture/furniture-list/furniture-list';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'furniture/page/:page', component: rpFurnitureList },
    ],
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
    canActivate: [loggedInGuard],
  },
];
