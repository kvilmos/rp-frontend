import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RpControlValueAccessor } from '../rp-control-value-accessor';

type InputType = 'text' | 'number' | 'email' | 'password';

@Component({
  standalone: true,
  selector: 'rp-text-input',
  templateUrl: './rp-text-input.html',
  styleUrl: './rp-text-input.scss',
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RpTextInput),
      multi: true,
    },
  ],
})
export class RpTextInput<T> extends RpControlValueAccessor<T> {
  @Input() inputId = '';
  @Input() label = '';
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() customErrorMessage: Record<string, ValidationErrors> | null = {};
}
