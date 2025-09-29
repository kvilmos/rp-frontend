import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NewUser } from './new_user';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from './user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  constructor() {}

  public registerNewUser(registrationFrom: FormGroup): void {
    const user: NewUser = registrationFrom.value;
    this.requestCreateUser(user).subscribe((data) => {
      console.log('REG:', data);
      this.router.navigate(['/']);
    });
  }

  private requestCreateUser(user: NewUser): Observable<any> {
    return this.http.post('/api/signup', user);
  }

  public loginUser(loginFrom: FormGroup): void {
    const user: User = loginFrom.value;

    this.requestLogin(user).subscribe((data) => {
      console.log('REG:', data);
      this.router.navigate(['/']);
    });
  }

  private requestLogin(user: User): Observable<any> {
    return this.http.post('/api/login', user);
  }
}
