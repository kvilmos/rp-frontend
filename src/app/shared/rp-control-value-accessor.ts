import { Directive, Inject, Injector, OnDestroy, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormControlDirective,
  FormControlName,
  FormGroupDirective,
  NgControl,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil, startWith, distinctUntilChanged, tap } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[rpControlValueAccessor]',
})
export class RpControlValueAccessor<T> implements ControlValueAccessor, OnInit, OnDestroy {
  public control: FormControl | undefined;
  public isRequired = false;
  public onTouched!: () => T;
  public isDisabled = false;

  private destroy$ = new Subject<void>();

  constructor(@Inject(Injector) private injector: Injector) {}

  public ngOnInit(): void {
    this.setFormControl();
    this.isRequired = this.control?.hasValidator(Validators.required) ?? false;
  }

  private setFormControl(): void {
    try {
      const formControl = this.injector.get(NgControl);

      switch (formControl.constructor) {
        case FormControlName:
          this.control = this.injector
            .get(FormGroupDirective)
            .getControl(formControl as FormControlName);
          break;
        default:
          this.control = (formControl as FormControlDirective).form as FormControl;
          break;
      }
    } catch (err) {
      this.control = new FormControl();
    }
  }

  public writeValue(value: T): void {
    if (!this.control) {
      this.control = new FormControl(value);
    } else if (this.control && this.control.value !== value) {
      this.control.setValue(value, { emitEvent: false });
    }
  }

  public registerOnChange(fn: (val: T | null) => T): void {
    this.control?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(this.control.value),
        distinctUntilChanged(),
        tap((val) => fn(val))
      )
      .subscribe(() => this.control?.markAsUntouched());
  }

  public registerOnTouched(fn: () => T): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
