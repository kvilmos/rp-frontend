import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RpNavbar } from '../../shared/rp-navbar/rp-navbar';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  templateUrl: 'main-layout.html',
  styleUrl: 'main-layout.scss',
  imports: [RouterOutlet, RpNavbar],
})
export class MainLayout {}
