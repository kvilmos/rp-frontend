import { Routes } from '@angular/router';
import { FurnitureUpload } from './feature/furniture/furniture-upload/furniture-upload';
import { AuthPage } from './feature/auth/auth-page/auth-page';
import { authGuard } from './feature/auth/auth-guard';
import { NotFound } from './common/page/not-found/not-found';
import { loggedInGuard } from './feature/auth/logged-in-guard';
import { RpBlueprintView } from './feature/planner/blueprint-view/blueprint-view';
import { RpFurnitureList } from './feature/furniture/furniture-list/furniture-list';
import { RpMainLayout } from './layout/rp-main-layout/rp-main-layout';
import { RpBlueprintList } from './feature/planner/blueprint-list/blueprint-list';
import { blueprintDataResolver } from './feature/planner/blueprint-data-resolver';
import { Home } from './common/page/home/home';

export const routes: Routes = [
  {
    path: '',
    component: RpMainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'furniture', component: RpFurnitureList },
      { path: 'profile/furniture', component: RpFurnitureList },
      { path: 'profile/blueprint', component: RpBlueprintList },
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
    path: 'room-editor/:blueprintId',
    component: RpBlueprintView,
    canActivate: [authGuard],
    resolve: {
      blueprint: blueprintDataResolver,
    },
  },
  {
    path: '**',
    component: NotFound,
    canActivate: [loggedInGuard],
  },
];
