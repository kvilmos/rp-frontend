import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { BlueprintControl } from './blueprint_control';
import { Blueprint } from './blueprint';

@Component({
  standalone: true,
  selector: 'rp-blueprint-view',
  templateUrl: 'blueprint-view.html',
  styleUrl: 'blueprint-view.scss',
  imports: [],
})
export class RpBlueprintView implements AfterViewInit {
  @ViewChild('blueprintCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  private blueprint: Blueprint;
  public blueprintCtrl!: BlueprintControl;

  constructor() {
    this.blueprint = new Blueprint();
  }

  public ngAfterViewInit(): void {
    this.blueprintCtrl = new BlueprintControl(this.canvasRef, this.blueprint);
  }

  @HostListener('window:resize')
  public handleWindowResize() {
    this.blueprintCtrl.view.handleWindowResize();
  }
}
