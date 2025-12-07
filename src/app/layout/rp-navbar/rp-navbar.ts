import { Component, inject } from '@angular/core';
import { AuthService } from '../../feature/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CompleteBlueprint } from '../../feature/planner/blueprint_load';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_SUCCESS_CLASS,
} from '../../common/constant/common.constant';
import { BlueprintApiService } from '../../api/blueprint-api-service';

@Component({
  standalone: true,
  selector: 'rp-navbar',
  templateUrl: 'rp-navbar.html',
  styleUrl: 'rp-navbar.scss',
  imports: [RouterLink, FontAwesomeModule],
})
export class RpNavbar {
  public logoutIcon = faArrowRightFromBracket;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bpApi = inject(BlueprintApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  constructor() {}

  public onCreateBlueprint(): void {
    this.translate.get('confirm.newBlueprint').subscribe((confirmStr: string) => {
      if (confirm(confirmStr)) {
        this.bpApi.createBlueprint().subscribe({
          next: (blueprint: CompleteBlueprint) => {
            this.router.navigate(['/room-editor', blueprint.id]);
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }

  public onClickLogout(): void {
    this.authService.logout();
    this.translate.get('server.success.logout').subscribe((message: string) => {
      this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
        duration: SNACKBAR_DURATION,
        panelClass: SNACKBAR_SUCCESS_CLASS,
      });
    });
  }
}
