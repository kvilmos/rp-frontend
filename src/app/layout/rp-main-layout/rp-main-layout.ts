import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RpNavbar } from '../rp-navbar/rp-navbar';

@Component({
  standalone: true,
  selector: 'rp-main-layout',
  templateUrl: 'rp-main-layout.html',
  styleUrl: 'rp-main-layout.scss',
  imports: [RouterOutlet, RpNavbar],
})
export class RpMainLayout {}
