import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[rpDropzone]',
})
export class RpDropzone {
  @Output() dropped = new EventEmitter<FileList>();
  @Output() hovered = new EventEmitter<boolean>();

  @HostListener('drop', ['$event'])
  public onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      this.dropped.emit(event.dataTransfer.files);
      this.hovered.emit(false);
    }
  }

  @HostListener('dragover', ['$event'])
  public onDragOver(event: DragEvent) {
    event.preventDefault();
    this.hovered.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.hovered.emit(false);
  }
}
