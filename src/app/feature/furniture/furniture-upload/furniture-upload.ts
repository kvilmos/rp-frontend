import { Component } from '@angular/core';
import { FurniturePreview } from '../furniture-preview/furniture-preview';
import { FurnitureForm } from '../furniture-form/furniture-form';

@Component({
  standalone: true,
  selector: 'rp-furniture-upload',
  templateUrl: './furniture-upload.html',
  styleUrl: './furniture-upload.scss',
  imports: [FurniturePreview, FurnitureForm],
})
export class FurnitureUpload {}
