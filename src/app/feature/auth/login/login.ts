import { Component, EventEmitter, inject, Output, signal, WritableSignal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { AuthService } from '../auth.service';
import { LoginCredentials } from '../login-credentials.interface';
import { Router } from '@angular/router';
import { ErrorHandler } from '../../../common/error/error-handler.service';
import { KeyValuePipe } from '@angular/common';
import { ErrorDisplay } from '../../../common/error/error.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_SUCCESS_CLASS,
} from '../../../common/constants/common.constant';

@Component({
  standalone: true,
  selector: 'rp-login',
  templateUrl: 'login.html',
  styleUrl: 'login.scss',
  imports: [KeyValuePipe, ReactiveFormsModule, TranslatePipe, RpTextInput, RpButton],
})
export class Login {
  @Output() modeClick = new EventEmitter<void>();
  public serverErrors: WritableSignal<ErrorDisplay[]> = signal([]);

  public loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
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
        this.translate.get('server.success.login').subscribe((message: string) => {
          this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
            duration: SNACKBAR_DURATION,
            panelClass: SNACKBAR_SUCCESS_CLASS,
          });
        });
      },
      error: (err) => {
        this.serverErrors.set(this.errorHandler.processHttpError(err));
      },
    });
  }

  public onClickMode(): void {
    this.modeClick.emit();
  }
}
