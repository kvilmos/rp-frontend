import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { NewUser } from './new_user.interface';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginCredentials } from './login_credentials.interface';
import { UserData } from './user_data.interface';
import { LoginResponse } from './login_response.interface';
import { Token } from './token.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessToken: string | null = null;
  private readonly currentUser = new BehaviorSubject<UserData | null>(null);
  private readonly authState = new BehaviorSubject<boolean>(false);

  private readonly http = inject(HttpClient);
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

  public registerNewUser(user: NewUser): Observable<any> {
    return this.http.post('/api/auth/register', user, { withCredentials: true });
  }

  public loginUser(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.requestLogin(credentials).pipe(
      tap((loginRes) => {
        this.accessToken = loginRes.accessToken;
        this.currentUser.next(loginRes.user);
        this.authState.next(true);
        this.router.navigate(['']);
      })
    );
  }

  private requestLogin(user: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', user, { withCredentials: true });
  }

  public logout(): void {
    this.requestLogout().subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
    });
  }

  private requestLogout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true });
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
    return this.http.get<UserData>('/api/verify/me', { withCredentials: true }).pipe(
      tap((user) => {
        this.currentUser.next(user);
        this.authState.next(true);
      })
    );
  }

  public renewToken(): Observable<Token> {
    return this.requestRenewToken().pipe(
      tap((token) => {
        this.accessToken = token.accessToken;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  public requestRenewToken(): Observable<Token> {
    return this.http.post<Token>('/api/auth/token', {}, { withCredentials: true });
  }
}
