import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCouch, faHouseChimneyWindow, faPenRuler } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { BlueprintApiService } from '../planner/blueprint-api-service';
import { CompleteBlueprint } from '../planner/blueprint_load';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [FontAwesomeModule, TranslatePipe],
})
export class Home {
  public addIcon = faPenRuler;
  public furnitureIcon = faCouch;
  public blueprintIcon = faHouseChimneyWindow;

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
}
