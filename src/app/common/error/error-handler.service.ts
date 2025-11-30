import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, ErrorDisplay, ValidationError } from './error.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ERROR_TRANSLATE_BASE } from '../constant/error.constant';
import {
  SNACKBAR_CLOSE_SYMBOL,
  SNACKBAR_DURATION,
  SNACKBAR_ERROR_CLASS,
} from '../constant/common.constant';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  constructor() {}

  public processHttpError(err: HttpErrorResponse): ErrorDisplay[] {
    const errors: ErrorDisplay[] = [];

    const apiError = err.error as ApiError;
    if (!apiError || !apiError.message) {
      const err: ErrorDisplay = { key: 'unexpectedError' };
      errors.push(err);
      this.showError(`${ERROR_TRANSLATE_BASE}common.internalServerError`);
      return errors;
    }

    if (typeof apiError.message === 'string') {
      const err: ErrorDisplay = { key: `${ERROR_TRANSLATE_BASE}${apiError.message}` };
      errors.push(err);
    }

    if (Array.isArray(apiError.message)) {
      const validationErrors = apiError.message as ValidationError[];
      if (validationErrors) {
        for (let i = 0; i < validationErrors.length; i++) {
          const errKey = `form.error.${validationErrors[i].key}.${validationErrors[i].condition}`;
          const err: ErrorDisplay = { key: errKey, param: validationErrors[i].param };
          errors.push(err);
        }
      }
    }

    return errors;
  }

  public handleHttpError(err: HttpErrorResponse): void {
    let translateRef = `${ERROR_TRANSLATE_BASE}common.unexpectedError`;

    switch (err.status) {
      case 422:
        translateRef = `${ERROR_TRANSLATE_BASE}common.unprocessableEntity`;
        break;
      case 500:
        translateRef = `${ERROR_TRANSLATE_BASE}common.internalServerError`;
        break;
      default:
        const apiError = err.error as ApiError;
        if (apiError && apiError.message) {
          translateRef = ERROR_TRANSLATE_BASE + apiError.message;
        }
        break;
    }

    this.translate.get(translateRef).subscribe((message: string) => {
      this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
        duration: SNACKBAR_DURATION,
        panelClass: SNACKBAR_ERROR_CLASS,
      });
    });
  }

  public showError(message: string): void {
    this.snackBar.open(message, SNACKBAR_CLOSE_SYMBOL, {
      duration: SNACKBAR_DURATION,
      panelClass: SNACKBAR_ERROR_CLASS,
    });
  }
}
