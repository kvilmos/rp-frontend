import { ElementRef, inject, Injectable, NgZone } from '@angular/core';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  GridHelper,
  Mesh,
  Object3D,
  AmbientLight,
  DirectionalLight,
  PlaneGeometry,
  ShadowMaterial,
  Color,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { PREVIEW } from '../../common/constants/renderer-constants';
import { FurnitureThumbnail } from './furniture_thumbnail';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private mainCanvasRef!: ElementRef<HTMLCanvasElement>;
  private thumbnailCanvasRef!: ElementRef<HTMLCanvasElement>;

  private mainRenderer!: WebGLRenderer;
  private thumbRenderer!: WebGLRenderer;

  private scene!: Scene;
  private mainCamera!: PerspectiveCamera;
  private thumbCamera!: PerspectiveCamera;
  private mainControls!: OrbitControls;

  private gridHelper!: GridHelper;
  private furnitureObject: Object3D | null = null;

  private animationFrameId?: number;

  private isGridVisible: boolean = true;
  private isDarkTheme: boolean = false;

  private readonly zone = inject(NgZone);

  public initMain(canvasRef: ElementRef<HTMLCanvasElement>): void {
    this.mainCanvasRef = canvasRef;
    this.scene = new Scene();
    this.scene.background = new Color(PREVIEW.BACKGROUND_COLOR_LIGHT);

    this.initGrid();
    this.initCamera();
    this.initLights();
    this.initShadowPlane();

    const canvas = this.mainCanvasRef.nativeElement;
    this.mainControls = new OrbitControls(this.mainCamera, canvas);
    this.mainControls.enableDamping = true;

    this.mainRenderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    this.mainRenderer.setPixelRatio(window.devicePixelRatio);
    this.mainRenderer.shadowMap.enabled = true;

    this.onResizeBrowser();
    this.startRenderingLoop();
  }

  public initThumbnail(canvasRef: ElementRef<HTMLCanvasElement>): void {
    if (!this.scene || !this.mainCamera) {
      console.error(new Error('Main canvas must be initialized before the thumbnail.'));
      return;
    }
    this.thumbnailCanvasRef = canvasRef;
    const canvas = this.thumbnailCanvasRef.nativeElement;

    this.thumbCamera = this.mainCamera.clone();
    this.thumbCamera.aspect = 1.0;
    this.thumbCamera.updateProjectionMatrix();

    this.thumbRenderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    this.thumbRenderer.setPixelRatio(window.devicePixelRatio);
    this.thumbRenderer.shadowMap.enabled = true;
    this.onResizeBrowser();
  }

  public setObject(object?: Object3D): void {
    if (this.furnitureObject) {
      this.scene.remove(this.furnitureObject);
      this.furnitureObject = null;
    }
    if (object) {
      this.furnitureObject = object;
      this.scene.add(this.furnitureObject);
      this.furnitureObject.position.set(0, 0, 0);
      this.furnitureObject.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
        }
      });
    }
  }

  public toggleGrid(): void {
    this.isGridVisible = !this.isGridVisible;
    this.gridHelper.visible = this.isGridVisible;
  }

  public toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.scene.background = new Color(
      this.isDarkTheme ? PREVIEW.BACKGROUND_COLOR_DARK : PREVIEW.BACKGROUND_COLOR_LIGHT
    );
  }

  public async createThumbnail(width: number, height: number): Promise<FurnitureThumbnail> {
    if (!this.scene || !this.mainCamera) {
      throw new Error('Scene and camera must be initialized to create a thumbnail.');
    }

    const tempCamera = this.mainCamera.clone();
    tempCamera.aspect = width / height;
    tempCamera.updateProjectionMatrix();

    const tempRenderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    tempRenderer.shadowMap.enabled = true;
    tempRenderer.setSize(width, height);

    const originalGridState = this.gridHelper.visible;
    this.gridHelper.visible = false;
    tempRenderer.render(this.scene, tempCamera);
    this.gridHelper.visible = originalGridState;

    const dataUrl = tempRenderer.domElement.toDataURL('image/png');
    tempRenderer.dispose();
    tempRenderer.forceContextLoss();

    const thumbnail: FurnitureThumbnail = {
      id: crypto.randomUUID(),
      imageSrc: dataUrl,
    };
    return thumbnail;
  }

  private startRenderingLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.zone.runOutsideAngular(() => {
      const render = () => {
        this.mainControls.update();
        this.mainRenderer.render(this.scene, this.mainCamera);

        if (this.thumbRenderer && this.thumbCamera) {
          this.thumbCamera.position.copy(this.mainCamera.position);
          this.thumbCamera.quaternion.copy(this.mainCamera.quaternion);

          const originalGridState = this.gridHelper.visible;
          this.gridHelper.visible = false;
          this.thumbRenderer.render(this.scene, this.thumbCamera);
          this.gridHelper.visible = originalGridState;
        }

        this.animationFrameId = requestAnimationFrame(render);
      };
      render();
    });
  }

  public onResizeBrowser(): void {
    if (this.mainCanvasRef) {
      const canvas = this.mainCanvasRef.nativeElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        this.mainRenderer.setSize(width, height, false);
        this.mainCamera.aspect = width / height;
        this.mainCamera.updateProjectionMatrix();
      }
    }
    if (this.thumbnailCanvasRef && this.thumbRenderer) {
      const canvas = this.thumbnailCanvasRef.nativeElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        this.thumbRenderer.setSize(width, height, false);
      }
    }
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initGrid(): void {
    this.gridHelper = new GridHelper(
      PREVIEW.GRID_SIZE,
      PREVIEW.GRID_DIVISION,
      PREVIEW.GRID_PRIMARY_COLOR,
      PREVIEW.GRID_PRIMARY_COLOR
    );
    this.gridHelper.visible = this.isGridVisible;
    this.scene.add(this.gridHelper);
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
    const canvas = this.mainCanvasRef.nativeElement;
    return canvas.clientHeight === 0 ? 1 : canvas.clientWidth / canvas.clientHeight;
  }

  private initShadowPlane(): void {
    const planeGeometry = new PlaneGeometry(PREVIEW.GRID_SIZE, PREVIEW.GRID_SIZE);
    const planeMaterial = new ShadowMaterial({ opacity: PREVIEW.SHADOW_OPACITY });
    const shadowPlane = new Mesh(planeGeometry, planeMaterial);
    shadowPlane.rotation.x = PREVIEW.SHADOW_PLANE_ROTATION_X;
    shadowPlane.position.y = PREVIEW.SHADOW_PLANE_Y_OFFSET;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  private initLights(): void {
    const ambientLight = new AmbientLight(
      PREVIEW.AMBIENT_LIGHT_COLOR,
      PREVIEW.AMBIENT_LIGHT_INTENSITY
    );
    this.scene.add(ambientLight);

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
    this.scene.add(directionalLight);
  }
}
