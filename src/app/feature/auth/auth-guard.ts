import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    first(),
    map((isLoggedIn) => {
      if (!isLoggedIn) {
        router.navigate(['/authentication']);
        return false;
      }
      return true;
    })
  );
};
