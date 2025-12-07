import { Component } from '@angular/core';
import { Registration } from '../registration/registration';
import { Login } from '../login/login';
import { NgClass } from '@angular/common';

@Component({
  standalone: true,
  selector: 'rp-auth-page',
  templateUrl: 'auth-page.html',
  styleUrl: 'auth-page.scss',
  imports: [Registration, Login, NgClass],
})
export class RpAuthPage {
  public isLoginMode = true;

  public onSelectLogin(): void {
    this.isLoginMode = true;
  }

  public onSelectRegistration(): void {
    this.isLoginMode = false;
  }
}
