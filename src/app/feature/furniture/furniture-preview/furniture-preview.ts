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
import { catchError, Observable, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectData } from '../object_data';
import { FurnitureThumbnail } from '../furniture_thumbnail';
import { THUMBNAIL } from '../../../common/constants/file-constants';
import { faCamera, faCircleHalfStroke, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ErrorHandler } from '../../../core/error/error_handler';

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

  public thumbnails$!: Observable<FurnitureThumbnail[]>;

  @ViewChild('previewCanvas', { static: true })
  private mainCanvas!: ElementRef<HTMLCanvasElement>;
  private mainRenderer!: WebGLRenderer;
  private mainScene!: Scene;
  private mainControls!: OrbitControls;
  private mainCamera!: PerspectiveCamera;
  private mainShadowPlane!: Mesh;
  private furnitureObject!: Object3D;

  private mainGrid!: GridHelper;
  private isMainGridShown: boolean = true;
  private isMainThemeDark: boolean = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly furnitureService = inject(FurnitureService);
  constructor() {}

  public ngAfterViewInit(): void {
    this.createPreviewCanvas();
    this.startRenderingLoop();
  }

  private createPreviewCanvas(): void {
    this.mainScene = new Scene();
    this.mainScene.background = new Color(PREVIEW.BACKGROUND_COLOR_LIGHT);
    this.mainGrid = new GridHelper(
      PREVIEW.GRID_SIZE,
      PREVIEW.GRID_DIVISION,
      PREVIEW.GRID_PRIMARY_COLOR,
      PREVIEW.GRID_PRIMARY_COLOR
    );

    this.mainGrid.visible = this.isMainGridShown;
    this.mainScene.add(this.mainGrid);

    this.initCamera();
    this.initShadowRendering();
    this.initLights();

    const canvas = this.mainCanvas.nativeElement;
    this.mainControls = new OrbitControls(this.mainCamera, canvas);
    this.mainControls.enableDamping = true;

    this.mainRenderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.mainRenderer.shadowMap.enabled = true;

    this.onResizeBrowser();
  }

  private initCamera(): void {
    const aspect = this.getAspectRatio();
    this.mainCamera = new PerspectiveCamera(
      PREVIEW.CAMERA_FOV,
      aspect,
      PREVIEW.CAMERA_NEAR_PLANE,
      PREVIEW.CAMERA_FAR_PLANE
    );
    this.mainCamera.position.z = PREVIEW.CAMERA_START_Z;
    this.mainCamera.position.y = PREVIEW.CAMERA_START_Y;
  }

  private getAspectRatio(): number {
    const canvas = this.mainCanvas.nativeElement;
    return canvas.clientHeight === 0 ? 1 : canvas.clientWidth / canvas.clientHeight;
  }

  private initShadowRendering(): void {
    const planeGeometry = new PlaneGeometry(PREVIEW.GRID_SIZE, PREVIEW.GRID_SIZE);
    const planeMaterial = new ShadowMaterial({ opacity: PREVIEW.SHADOW_OPACITY });
    this.mainShadowPlane = new Mesh(planeGeometry, planeMaterial);
    this.mainShadowPlane.rotation.x = PREVIEW.SHADOW_PLANE_ROTATION_X;
    this.mainShadowPlane.position.y = PREVIEW.SHADOW_PLANE_Y_OFFSET;
    this.mainShadowPlane.receiveShadow = true;
    this.mainScene.add(this.mainShadowPlane);
  }

  private initLights(): void {
    const ambientLight = new AmbientLight(
      PREVIEW.AMBIENT_LIGHT_COLOR,
      PREVIEW.AMBIENT_LIGHT_INTENSITY
    );
    this.mainScene.add(ambientLight);

    const directionalLight = new DirectionalLight(
      PREVIEW.DIRECTIONAL_LIGHT_COLOR,
      PREVIEW.DIRECTIONAL_LIGHT_INTENSITY
    );
    directionalLight.position.set(
      PREVIEW.DIRECTIONAL_LIGHT_POS_X,
      PREVIEW.DIRECTIONAL_LIGHT_POS_Y,
      PREVIEW.DIRECTIONAL_LIGHT_POS_Z
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = PREVIEW.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = PREVIEW.SHADOW_MAP_SIZE;
    this.mainScene.add(directionalLight);
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
              this.errorHandler.showUserError(error);
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
          this.errorHandler.showUserError('fileReaderFailed');
          return;
        }

        loader.parse(
          fileContent,
          '',
          (gltf) => {
            this.clearScene();

            this.furnitureObject = gltf.scene;
            this.mainScene.add(this.furnitureObject);
            this.furnitureObject.position.sub(new Vector3(0, 0, 0));
            this.furnitureObject.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true;
              }
            });

            const box = new Box3().setFromObject(this.furnitureObject);
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

  private clearScene(): void {
    if (this.furnitureObject) {
      this.mainScene.remove(this.furnitureObject);
      this.furnitureObject = new Object3D();
    }
  }

  public onCreateThumbnail(): void {
    const thumbnail = this.createThumbnail(THUMBNAIL.WIDTH, THUMBNAIL.HIGHT);
    this.furnitureService.pushThumbnail(thumbnail);
  }

  private createThumbnail(width: number, height: number): FurnitureThumbnail {
    const camera = this.mainCamera.clone();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const thumbRenderer = new WebGLRenderer({ antialias: true, alpha: true });
    thumbRenderer.shadowMap.enabled = true;
    thumbRenderer.setSize(width, height);
    thumbRenderer.render(this.mainScene, camera);

    const dataUrl = thumbRenderer.domElement.toDataURL('image/png');
    const thumbnail: FurnitureThumbnail = {
      id: crypto.randomUUID(),
      imageSrc: dataUrl,
    };

    thumbRenderer.dispose();
    thumbRenderer.forceContextLoss();

    return thumbnail;
  }

  public onResetThumbnails(): void {
    this.furnitureService.resetThumbnails();
  }

  public onToggleGrid(): void {
    this.isMainGridShown = !this.isMainGridShown;
    this.mainGrid.visible = this.isMainGridShown;
  }

  public onChangeTheme(): void {
    this.isMainThemeDark = !this.isMainThemeDark;
    if (!this.isMainThemeDark) {
      this.mainScene.background = PREVIEW.BACKGROUND_COLOR_LIGHT;
    } else {
      this.mainScene.background = PREVIEW.BACKGROUND_COLOR_DARK;
    }
  }

  public startRenderingLoop(): void {
    const component: FurniturePreview = this;
    (function render() {
      component.mainControls.update();
      component.mainRenderer.render(component.mainScene, component.mainCamera);
      requestAnimationFrame(render);
    })();
  }

  @HostListener('window:resize')
  public onResizeBrowser(): void {
    const canvas = this.mainCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    this.mainRenderer.setSize(width, height, false);
    this.mainCamera.aspect = width / height;
    this.mainCamera.updateProjectionMatrix();
  }
}
