import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { AuthService } from '../auth.service';
import { LoginCredentials } from '../login_credentials';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'rp-login',
  templateUrl: 'login.html',
  styleUrl: 'login.scss',
  imports: [ReactiveFormsModule, TranslatePipe, RpTextInput, RpButton],
})
export class Login {
  public loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  constructor() {}

  public onSubmitForm(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const credentials: LoginCredentials = this.loginForm.value as LoginCredentials;
    this.authService.loginUser(credentials).subscribe({
      next: () => {
        this.loginForm.reset();
        this.router.navigate(['/']);
      },
      error: (err) => {
        // TODO STORY-201 Error handler
      },
    });
  }
}
