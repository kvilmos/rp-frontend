import { inject, Injectable } from '@angular/core';
import { NewUser } from '../feature/auth/new-user.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginCredentials } from '../feature/auth/login-credentials.interface';
import { LoginResponse } from '../feature/auth/login-response.interface';
import { Token } from '../feature/auth/token.interface';
import { UserData } from '../feature/auth/user-data.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  constructor() {}

  public registerUser(user: NewUser): Observable<any> {
    return this.http.post('/api/auth/register', user, { withCredentials: true });
  }

  public login(user: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', user, { withCredentials: true });
  }

  public logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true });
  }

  public renewToken(): Observable<Token> {
    return this.http.post<Token>('/api/auth/token', {}, { withCredentials: true });
  }

  public verifyUser(): Observable<UserData> {
    return this.http.get<UserData>('/api/verify/me', { withCredentials: true });
  }
}
