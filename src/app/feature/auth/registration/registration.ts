import { Component, EventEmitter, inject, Output, signal, WritableSignal } from '@angular/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { RpValidationError } from '../../../shared/rp-validation-error/rp-validation-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NewUser } from '../new-user.interface';
import { matchValidator } from '../../../common/utils/validator';
import { ErrorDisplay } from '../../../common/error/error.interface';
import { ErrorHandler } from '../../../common/error/error-handler.service';
import { KeyValuePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_SUCCESS_CLASS,
} from '../../../common/constant/common.constant';
import { AuthApiService } from '../../../api/auth-api.service';

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
  private readonly authApi = inject(AuthApiService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly translate = inject(TranslateService);
  constructor() {}

  public onSubmitForm(): void {
    this.isSubmitted = true;
    if (this.registrationForm.invalid) {
      return;
    }

    const user: NewUser = this.registrationForm.value as NewUser;
    this.authApi.registerUser(user).subscribe({
      next: () => {
        this.registrationForm.reset;
        this.translate.get('server.success.registration').subscribe((message: string) => {
          this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
            duration: SNACKBAR_DURATION,
            panelClass: SNACKBAR_SUCCESS_CLASS,
          });
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
