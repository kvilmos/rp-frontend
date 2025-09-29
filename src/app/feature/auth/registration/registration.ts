import { Component, inject } from '@angular/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  selector: 'rp-registration',
  templateUrl: 'registration.html',
  styleUrl: 'registration.scss',
  imports: [ReactiveFormsModule, RpTextInput, RpButton, RpValidationError, TranslatePipe],
})
export class Registration {
  public registrationForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    emailConfirm: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    passwordConfirm: new FormControl('', [Validators.required]),
  });

  private readonly authService = inject(AuthService);
  constructor() {}

  public onSubmitForm(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.authService.registerNewUser(this.registrationForm);
    this.registrationForm.reset();
  }
}
