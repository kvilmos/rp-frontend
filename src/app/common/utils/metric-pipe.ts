import { Pipe, PipeTransform } from '@angular/core';

type TargetUnit = 'cm' | 'mm' | 'm';

@Pipe({
  name: 'metric',
})
export class MetricPipe implements PipeTransform {
  public transform(value: number | null | undefined, targetUnit: TargetUnit = 'm'): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    switch (targetUnit) {
      case 'cm':
        return value * 100;
      case 'mm':
        return value * 1000;
      case 'm':
      default:
        return value;
    }
  }
}
