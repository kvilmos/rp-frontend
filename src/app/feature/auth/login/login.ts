import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { AuthService } from '../auth.service';

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
  constructor() {}

  public onSubmitForm(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.authService.loginUser(this.loginForm);
    this.loginForm.reset();
  }
}
