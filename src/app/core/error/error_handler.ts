import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError, ErrorDisplay, ValidationError } from './type';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandler {
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
}
