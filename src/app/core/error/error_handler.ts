import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, ErrorDisplay, ValidationError } from './type';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  public parseHttpError(err: HttpErrorResponse): ErrorDisplay[] {
    const errors: ErrorDisplay[] = [];

    const apiError = err.error as ApiError;
    if (!apiError || !apiError.message) {
      const err: ErrorDisplay = { key: 'unexpectedError' };
      errors.push(err);
      return errors;
    }

    if (typeof apiError.message === 'string') {
      const err: ErrorDisplay = { key: apiError.message };
      errors.push(err);
    }

    if (Array.isArray(apiError.message)) {
      const validationErrors = apiError.message as ValidationError[];
      if (validationErrors) {
        for (let i = 0; i < validationErrors.length; i++) {
          const errKey = `${validationErrors[i].key}.${validationErrors[i].condition}`;
          const err: ErrorDisplay = { key: errKey, param: validationErrors[i].param };
          errors.push(err);
        }
      }
    }

    return errors;
  }

  public handleHttpError(error: any): void {
    console.log(error);

    this.translate.get('error.type.unexpectedError').subscribe((message: string) => {
      this.snackBar.open(message, 'x', {
        duration: 5000,
      });
    });
  }

  public showUserError(message: string): void {
    this.snackBar.open(message, 'x', {
      duration: 3000,
    });
  }
}
