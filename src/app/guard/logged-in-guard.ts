import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';
import { AuthService } from '../feature/auth/auth.service';

export const loggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    first(),
    map((isLoggedIn) => {
      if (isLoggedIn) {
        router.navigate(['']);
        return false;
      }
      return true;
    })
  );
};
