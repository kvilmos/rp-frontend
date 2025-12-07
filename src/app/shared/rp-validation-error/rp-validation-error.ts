import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'rp-validation-error',
  templateUrl: './rp-validation-error.html',
  styleUrl: './rp-validation-error.scss',
  imports: [CommonModule, TranslatePipe],
})
export class RpValidationError implements OnChanges {
  @Input() errors: Record<string, ValidationErrors> | null = {};
  @Input() customErrorMessage: Record<string, ValidationErrors> | null = {};

  public errorMessages: Record<string, string> = {};

  public ngOnChanges(changes: SimpleChanges): void {
    const { customErrorMessage } = changes;
    if (customErrorMessage) {
      this.errorMessages = {
        ...this.errorMessages,
        ...customErrorMessage.currentValue,
      };
    }
  }
}
