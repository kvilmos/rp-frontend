import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [],
})
export class Home {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  constructor() {}

  public onClickLogout(): void {
    this.authService.logout();
  }
  public onClickFurnitureUpload(): void {
    this.router.navigate(['furniture-upload']);
  }
}
