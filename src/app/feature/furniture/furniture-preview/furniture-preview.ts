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
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  GridHelper,
  Color,
  AmbientLight,
  DirectionalLight,
  Object3D,
  Box3,
  Vector3,
  PlaneGeometry,
  ShadowMaterial,
  Mesh,
} from 'three';
import { PREVIEW } from '../../../common/constants/renderer-constants';
import { RpThumbnail } from '../../../shared/rp-thumbnail/rp-thumbnail';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectData } from '../object_data';

@Component({
  standalone: true,
  selector: 'rp-furniture-preview',
  templateUrl: './furniture-preview.html',
  styleUrl: './furniture-preview.scss',
  imports: [RpThumbnail, AsyncPipe],
})
export class FurniturePreview implements OnInit, AfterViewInit {
  public thumbnails$!: Observable<string[]>;

  @ViewChild('previewCanvas', { static: true })
  private previewCanvas!: ElementRef<HTMLCanvasElement>;
  private controls!: OrbitControls;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private shadowPlane!: Mesh;
  private renderer3d!: WebGLRenderer;
  private furniture!: Object3D;

  private backgroundGrid!: GridHelper;
  private isGridVisible: boolean = true;
  private isDark: boolean = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly furnitureService = inject(FurnitureService);
  constructor() {}

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.createPreviewCanvas();
      this.startRenderingLoop();
    }, 0);
  }

  private createPreviewCanvas(): void {
    this.scene = new Scene();
    this.scene.background = new Color(0xf2f0ea);

    this.backgroundGrid = new GridHelper(PREVIEW.GRID_SIZE, PREVIEW.GRID_DIVISION);
    this.scene.add(this.backgroundGrid);

    // CAMERA
    const aspect = this.getAspectRatio();
    this.camera = new PerspectiveCamera(
      PREVIEW.CAMERA_FOV,
      aspect,
      PREVIEW.CAMERA_NEAR_PLANE,
      PREVIEW.CAMERA_FAR_PLANE
    );
    this.camera.position.z = PREVIEW.CAMERA_START_Z;
    this.camera.position.y = 2;

    const planeGeometry = new PlaneGeometry(PREVIEW.GRID_SIZE, PREVIEW.GRID_SIZE);
    const planeMaterial = new ShadowMaterial({ opacity: 0.3 });
    this.shadowPlane = new Mesh(planeGeometry, planeMaterial);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0.01;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // LIGHT
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const canvas = this.previewCanvas.nativeElement;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    this.renderer3d = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer3d.shadowMap.enabled = true;

    this.onResizeBrowser();
  }

  private getAspectRatio(): number {
    const canvas = this.previewCanvas.nativeElement;
    return canvas.clientHeight === 0 ? 1 : canvas.clientWidth / canvas.clientHeight;
  }

  public ngOnInit(): void {
    this.furnitureService
      .getFile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((file) => {
          if (!file) {
            this.clearScene();
            return of(null);
          }

          return this.processFurnitureFile$(file).pipe(
            catchError((error) => {
              //TODO STORY-201 Handle error.
              console.error('Hiba a fájl feldolgozása során:', error);
              this.clearScene();

              return of(null);
            })
          );
        })
      )
      .subscribe((data: ObjectData | null) => {
        this.furnitureService.setObjectData(data);
      });

    this.thumbnails$ = this.furnitureService.getThumbnails();
  }

  private processFurnitureFile$(file: File): Observable<ObjectData> {
    return new Observable((observer) => {
      const loader = new GLTFLoader();
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (!(fileContent instanceof ArrayBuffer)) {
          // TODO: STORY-201 ERROR HANDLER
          observer.error(new Error('A fájl beolvasása nem ArrayBuffer-t eredményezett.'));
          return;
        }

        loader.parse(
          fileContent,
          '',
          (gltf) => {
            this.clearScene();

            this.furniture = gltf.scene;
            this.scene.add(this.furniture);

            const box = new Box3().setFromObject(this.furniture);
            const size = new Vector3();
            box.getSize(size);

            const meta: ObjectData = {
              sizeX: size.x,
              sizeY: size.y,
              sizeZ: size.z,
            };

            this.furniture.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true;
              }
            });

            this.furniture.position.sub(new Vector3(0, 0, 0));

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

  private clearScene(): void {
    if (this.furniture) {
      this.scene.remove(this.furniture);
      this.furniture = new Object3D();
    }
  }

  public takePhoto(): void {
    const dataUrl = this.createThumbnail(300, 300);
    this.furnitureService.pushThumbnail(dataUrl);
  }

  private createThumbnail(width: number = 300, height: number = 300): string {
    const thumbCamera = this.camera.clone();
    thumbCamera.aspect = width / height;
    thumbCamera.updateProjectionMatrix();

    const thumbRenderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    thumbRenderer.shadowMap.enabled = true;

    thumbRenderer.setSize(width, height);
    thumbRenderer.render(this.scene, thumbCamera);

    const dataUrl = thumbRenderer.domElement.toDataURL('image/png');

    thumbRenderer.dispose();
    thumbRenderer.forceContextLoss();

    return dataUrl;
  }

  public resetThumbnails(): void {
    this.furnitureService.resetThumbnails();
  }

  public toggleShadow(): void {
    this.shadowPlane.visible = !this.shadowPlane.visible;
  }

  public toggleGrid(): void {
    this.isGridVisible = !this.isGridVisible; // Átfordítjuk az állapotot
    this.backgroundGrid.visible = this.isGridVisible;
  }

  public removeGrid(): void {
    this.backgroundGrid.visible = false;
    this.isGridVisible = false;
  }

  public showGrid(): void {
    this.backgroundGrid.visible = true;
    this.isGridVisible = true;
  }

  public toggleDarkMode(): void {
    this.isDark = !this.isDark;
    if (!this.isDark) {
      this.scene.background = new Color(0xf2f0ea);
    } else {
      this.scene.background = new Color(0x323231);
    }
  }

  public startRenderingLoop(): void {
    const component: FurniturePreview = this;
    (function render() {
      component.controls.update();
      component.renderer3d.render(component.scene, component.camera);
      requestAnimationFrame(render);
    })();
  }

  @HostListener('window:resize')
  public onResizeBrowser(): void {
    const canvas = this.previewCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    this.renderer3d.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
