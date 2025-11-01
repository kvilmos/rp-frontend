import { Component, inject } from '@angular/core';
import { AuthService } from '../../feature/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { BlueprintApiService } from '../../feature/planner/blueprint-api-service';
import { CompleteBlueprint } from '../../feature/planner/blueprint_load';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  selector: 'rp-navbar',
  templateUrl: 'navbar.html',
  styleUrl: 'navbar.scss',
  imports: [RouterLink, FontAwesomeModule],
})
export class RpNavbar {
  public logoutIcon = faArrowRightFromBracket;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bpApi = inject(BlueprintApiService);

  constructor() {}

  public onCreateBlueprint(): void {
    this.bpApi.createBlueprint().subscribe({
      next: (blueprint: CompleteBlueprint) => {
        this.router.navigate(['/room-editor', blueprint.id]);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  public onClickLogout(): void {
    this.authService.logout();
  }
}
