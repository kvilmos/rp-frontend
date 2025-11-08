import { Component, EventEmitter, inject, Output, signal, WritableSignal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RpTextInput } from '../../../shared/rp-text-input/rp-text-input';
import { RpButton } from '../../../shared/rp-button/rp-button';
import { AuthService } from '../auth.service';
import { LoginCredentials } from '../login-credentials.interface';
import { Router } from '@angular/router';
import { ErrorHandler } from '../../../core/error/error-handler.service';
import { KeyValuePipe } from '@angular/common';
import { ErrorDisplay } from '../../../core/error/error.interface';

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
        this.serverErrors.set(this.errorHandler.processHttpError(err));
      },
    });
  }

  public onClickMode(): void {
    this.modeClick.emit();
  }
}
