import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RpDropzone } from '../rp-dropzone';
let nextUniqueId = 0;

@Component({
  standalone: true,
  selector: 'rp-file-input',
  templateUrl: './rp-file-input.html',
  styleUrl: './rp-file-input.scss',
  imports: [RpDropzone],
})
export class RpFileInput {
  @Input() inputId = '';
  @Input() label = '';
  @Input() allowedFileTypes: string = '';

  @Output() selected = new EventEmitter<File>();

  public domId!: string;
  public isHovering = false;
  public selectedFile: File | null = null;

  public ngOnInit(): void {
    this.domId = this.inputId || `rp-file-input-${nextUniqueId++}`;
  }

  public toggleHover(event: boolean) {
    this.isHovering = event;
  }

  public onDrop(fileList: FileList) {
    if (fileList[0]) {
      const file = fileList[0];
      this.selectedFile = file;
      this.selected.emit(file);
    }
  }
}
