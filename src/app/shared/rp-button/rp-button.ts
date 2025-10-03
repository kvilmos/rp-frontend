import { Component, EventEmitter, Input, Output } from '@angular/core';

type ButtonType = 'submit' | 'reset' | 'button';

@Component({
  standalone: true,
  selector: 'rp-button',
  templateUrl: './rp-button.html',
  styleUrl: './rp-button.scss',
  imports: [],
})
export class RpButton {
  @Input() type: ButtonType = 'button';
  @Output() click = new EventEmitter<void>();

  public onClick(): void {
    this.click.emit();
  }
}
