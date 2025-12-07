import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCouch, faHouseChimneyWindow, faPenRuler } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { CompleteBlueprint } from '../../../feature/planner/blueprint_load';
import { BlueprintApiService } from '../../../api/blueprint-api-service';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [FontAwesomeModule, TranslatePipe, RouterLink],
})
export class Home {
  public addIcon = faPenRuler;
  public furnitureIcon = faCouch;
  public blueprintIcon = faHouseChimneyWindow;

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
