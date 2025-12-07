import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginCredentials } from './login-credentials.interface';
import { UserData } from './user-data.interface';
import { LoginResponse } from './login-response.interface';
import { Token } from './token.interface';
import { AuthApiService } from '../../api/auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessToken: string | null = null;
  private readonly currentUser = new BehaviorSubject<UserData | null>(null);
  private readonly authState = new BehaviorSubject<boolean>(false);

  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  constructor() {}

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getCurrentUser(): Observable<UserData | null> {
    return this.currentUser.asObservable();
  }

  public getAuthState(): Observable<boolean> {
    return this.authState.asObservable();
  }

  public loginUser(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.authApi.login(credentials).pipe(
      tap((loginRes) => {
        this.accessToken = loginRes.accessToken;
        this.currentUser.next(loginRes.user);
        this.authState.next(true);
        this.router.navigate(['']);
      })
    );
  }

  public logout(): void {
    this.authApi.logout().subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
    });
  }

  private handleLogout(): void {
    this.accessToken = null;
    this.currentUser.next(null);
    this.authState.next(false);
    this.router.navigate(['/authentication']);
  }

  public initializeAppState(): Observable<any> {
    return this.renewToken().pipe(
      switchMap(() => {
        return this.requestCurrentUser();
      }),

      catchError(() => {
        this.authState.next(false);
        this.currentUser.next(null);
        this.handleLogout();
        return of(null);
      })
    );
  }

  public requestCurrentUser(): Observable<UserData> {
    return this.authApi.verifyUser().pipe(
      tap((user) => {
        this.currentUser.next(user);
        this.authState.next(true);
      })
    );
  }

  public renewToken(): Observable<Token> {
    return this.authApi.renewToken().pipe(
      tap((token) => {
        this.accessToken = token.accessToken;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }
}
