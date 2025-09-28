import { Component } from '@angular/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'rp-registration',
  templateUrl: 'registration.html',
  styleUrl: 'registration.scss',
  imports: [ReactiveFormsModule, RpTextInput, RpButton, RpValidationError],
})
export class Registration {
  public registrationForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    emailConfirm: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    passwordConfirm: new FormControl('', [Validators.required]),
  });

  public onSubmitForm(): void {
    if (this.registrationForm.invalid) {
      // TODO: STORY-201 ERROR HANDLER
      return;
    }
  }
}
