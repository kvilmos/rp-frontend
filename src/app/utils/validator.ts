import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    const errorKey = `${controlName}Mismatch`;
    const errors = matchingControl.errors || {};

    if (control.value !== matchingControl.value) {
      errors[errorKey] = true;
      matchingControl.setErrors(errors);
    } else {
      if (errors[errorKey]) {
        delete errors[errorKey];
        if (Object.keys(errors).length === 0) {
          matchingControl.setErrors(null);
        } else {
          matchingControl.setErrors(errors);
        }
      }
    }

    return null;
  };
}
