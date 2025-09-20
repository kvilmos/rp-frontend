import { Component, Input } from '@angular/core';

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
}
