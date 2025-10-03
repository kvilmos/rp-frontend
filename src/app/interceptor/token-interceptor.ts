import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../feature/auth/auth.service';
import { Token } from '../feature/auth/token';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();
  if (accessToken) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('api/auth')) {
        return authService.renewToken().pipe(
          switchMap((renewResponse: Token) => {
            return next(
              req.clone({ setHeaders: { Authorization: `Bearer ${renewResponse.accessToken}` } })
            );
          })
        );
      }
      return throwError(() => error);
    })
  );
};
