import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../auth.service';
import { NewUser } from '../new_user';
import { Router } from '@angular/router';
import { matchValidator } from '../../../common/validator';

@Component({
  standalone: true,
  selector: 'rp-registration',
  templateUrl: 'registration.html',
  styleUrl: 'registration.scss',
  imports: [ReactiveFormsModule, RpTextInput, RpButton, RpValidationError, TranslatePipe],
})
export class Registration {
  @Output() modeClick = new EventEmitter<void>();

  public isSubmitted = false;
  public registrationForm = new FormGroup(
    {
      username: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      email: new FormControl('', [Validators.required, Validators.maxLength(255)]),
      emailConfirm: new FormControl(''),
      password: new FormControl('', [
        Validators.required,
        Validators.maxLength(255),
        Validators.minLength(8),
      ]),
      passwordConfirm: new FormControl(''),
    },
    {
      validators: [
        matchValidator('password', 'passwordConfirm'),
        matchValidator('email', 'emailConfirm'),
      ],
    }
  );

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  constructor() {}

  public onSubmitForm(): void {
    this.isSubmitted = true;
    if (this.registrationForm.invalid) {
      return;
    }

    const user: NewUser = this.registrationForm.value as NewUser;
    this.authService.registerNewUser(user).subscribe({
      next: () => {
        this.registrationForm.reset;
        this.modeClick.emit();
      },
      error: (err) => {
        // TODO STORY-201 Error handler
      },
    });
  }

  public onClickMode(): void {
    this.modeClick.emit();
  }
}
