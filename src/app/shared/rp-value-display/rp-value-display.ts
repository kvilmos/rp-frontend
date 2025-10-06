import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'rp-value-display',
  templateUrl: './rp-value-display.html',
  styleUrl: './rp-value-display.scss',
  imports: [],
})
export class RpValueDisplay {
  @Input() label = '';
}
