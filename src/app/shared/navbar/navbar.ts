import { Component, inject } from '@angular/core';
import { AuthService } from '../../feature/auth/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'rp-navbar',
  templateUrl: 'navbar.html',
  styleUrl: 'navbar.scss',
  imports: [RouterLink],
})
export class RpNavbar {
  private readonly authService = inject(AuthService);

  public onClickLogout(): void {
    this.authService.logout();
  }
}
