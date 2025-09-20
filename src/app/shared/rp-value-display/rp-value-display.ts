import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';

@Component({
  standalone: true,
  selector: 'rp-value-display',
  templateUrl: './rp-value-display.html',
  styleUrl: './rp-value-display.scss',
  imports: [],
})
export class RpValueDisplay implements AfterContentInit {
  @Input() label = '';

  public ngAfterContentInit(): void {}
}
