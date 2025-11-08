import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FurnitureService } from '../furniture.service';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Box3, Vector3, Mesh } from 'three';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectData } from '../object_data';
import { faCamera, faCircleHalfStroke, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ErrorHandler } from '../../../core/error/error-handler.service';
import { PreviewService } from '../preview.service';

@Component({
  standalone: true,
  selector: 'rp-furniture-preview',
  templateUrl: './furniture-preview.html',
  styleUrl: './furniture-preview.scss',
  imports: [FontAwesomeModule],
})
export class FurniturePreview implements OnInit, AfterViewInit {
  public faCam = faCamera;
  public faGrid = faTableCells;
  public faTheme = faCircleHalfStroke;

  @ViewChild('previewCanvas', { static: true })
  private mainCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly furnitureService = inject(FurnitureService);
  private readonly previewService = inject(PreviewService);
  constructor() {}

  public ngOnInit(): void {
    this.furnitureService.file$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((file) => {
          if (!file) {
            this.previewService.setObject();
            return of(null);
          }

          return this.processFurnitureFile$(file).pipe(
            catchError((error) => {
              this.errorHandler.showError(error);
              this.previewService.setObject();
              return of(null);
            })
          );
        })
      )
      .subscribe((data: ObjectData | null) => {
        this.furnitureService.setObjectData(data);
      });
  }

  public ngAfterViewInit(): void {
    this.previewService.initMain(this.mainCanvas);
  }

  private processFurnitureFile$(file: File): Observable<ObjectData> {
    return new Observable((observer) => {
      const loader = new GLTFLoader();
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (!(fileContent instanceof ArrayBuffer)) {
          this.errorHandler.showError('fileReaderFailed');
          return;
        }

        loader.parse(
          fileContent,
          '',
          (gltf) => {
            this.previewService.setObject();
            const object = gltf.scene;

            const box = new Box3().setFromObject(object);
            const verticalOffset = box.min.y;
            object.translateY(-verticalOffset);
            object.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true;
              }
            });
            this.previewService.setObject(object);

            const size = new Vector3();
            box.getSize(size);
            const meta: ObjectData = {
              sizeX: size.x,
              sizeY: size.y,
              sizeZ: size.z,
            };
            observer.next(meta);
            observer.complete();
          },
          (error) => observer.error(error)
        );
      };
      reader.onerror = (error) => observer.error(error);

      reader.readAsArrayBuffer(file);
    });
  }

  public onToggleGrid(): void {
    this.previewService.toggleGrid();
  }

  public onChangeTheme(): void {
    this.previewService.toggleTheme();
  }

  @HostListener('window:resize')
  public onResizeBrowser(): void {
    this.previewService.onResizeBrowser();
  }
}
