import { Component } from '@angular/core';
import { Registration } from '../registration/registration';
import { Login } from '../login/login';

@Component({
  standalone: true,
  selector: 'rp-auth-page',
  templateUrl: 'auth-page.html',
  styleUrl: 'auth-page.scss',
  imports: [Registration, Login],
})
export class AuthPage {}
