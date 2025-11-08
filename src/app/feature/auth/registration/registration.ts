import { Component, EventEmitter, inject, Output, signal, WritableSignal } from '@angular/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../auth.service';
import { NewUser } from '../new-user.interface';
import { matchValidator } from '../../../common/validator';
import { ErrorDisplay } from '../../../core/error/error.interface';
import { ErrorHandler } from '../../../core/error/error-handler.service';
import { KeyValuePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'rp-registration',
  templateUrl: 'registration.html',
  styleUrl: 'registration.scss',
  imports: [
    KeyValuePipe,
    ReactiveFormsModule,
    RpTextInput,
    RpButton,
    RpValidationError,
    TranslatePipe,
  ],
})
export class Registration {
  @Output() modeClick = new EventEmitter<void>();

  public isSubmitted = false;
  public serverErrors: WritableSignal<ErrorDisplay[]> = signal([]);
  public registrationForm = new FormGroup(
    {
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(100),
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.minLength(6),
        Validators.maxLength(255),
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255),
      ]),
      emailConfirm: new FormControl(''),
      passwordConfirm: new FormControl(''),
    },
    {
      validators: [
        matchValidator('password', 'passwordConfirm'),
        matchValidator('email', 'emailConfirm'),
      ],
    }
  );

  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandler);
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
        this.snackBar.open('success', 'x', {
          duration: 1000,
          panelClass: ['registration-success'],
        });
        this.modeClick.emit();
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err);
        this.serverErrors.set(this.errorHandler.processHttpError(err));
      },
    });
  }

  public onClickMode(): void {
    this.modeClick.emit();
  }
}
