import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RpControlValueAccessor } from '../rp-control-value-accessor';

@Component({
  standalone: true,
  selector: 'rp-select-input',
  templateUrl: './rp-select-input.html',
  styleUrl: './rp-select-input.scss',
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RpSelectInput),
      multi: true,
    },
  ],
})
export class RpSelectInput<T> extends RpControlValueAccessor<T> {
  @Input() options: T[] = [];
  @Input() selectId = '';
  @Input() label = '';
  @Input() customErrorMessage: Record<string, ValidationErrors> | null = {};
}
