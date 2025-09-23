import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FurnitureService, ModelMeta } from '../furniture.service';
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
} from 'three';
import { PREVIEW } from '../../../common/constants/renderer-constants';

@Component({
  standalone: true,
  selector: 'rp-furniture-preview',
  templateUrl: './furniture-preview.html',
  styleUrl: './furniture-preview.scss',
  imports: [],
})
export class FurniturePreview implements OnInit, AfterViewInit {
  @ViewChild('previewCanvas', { static: true })
  private previewCanvas!: ElementRef<HTMLCanvasElement>;
  private controls!: OrbitControls;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer3d!: WebGLRenderer;
  private model!: Object3D;

  constructor(private furnitureService: FurnitureService) {}

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.createPreviewCanvas();
      this.startRenderingLoop();
    }, 0);
  }

  private createPreviewCanvas(): void {
    this.scene = new Scene();
    this.scene.background = new Color(0xbebfbe);
    const backgroundGrid = new GridHelper(PREVIEW.GRID_SIZE, PREVIEW.GRID_DIVISION);
    this.scene.add(backgroundGrid);

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

    // LIGHT
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 5);
    this.scene.add(directionalLight);

    const canvas = this.previewCanvas.nativeElement;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    this.renderer3d = new WebGLRenderer({ canvas: canvas, antialias: true });
    this.onResizeBrowser();
  }

  private getAspectRatio(): number {
    const canvas = this.previewCanvas.nativeElement;
    return canvas.clientHeight === 0 ? 1 : canvas.clientWidth / canvas.clientHeight;
  }

  public ngOnInit(): void {
    this.furnitureService.fileData$.subscribe((modelMeta: ModelMeta | null) => {
      if (!modelMeta || !modelMeta.file) {
        if (this.model) {
          this.scene.remove(this.model);
        }
      } else {
        this.loadFurniturePreview(modelMeta.file);
      }
    });
  }

  private loadFurniturePreview(file: File): void {
    const loader = new GLTFLoader();
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target?.result;
      if (!(fileContent instanceof ArrayBuffer)) {
        // TODO: STORY-201 ERROR HANDLER
        console.error('Hiba: A fájl beolvasása nem ArrayBuffer-t eredményezett.');
        return;
      }

      loader.parse(
        fileContent,
        '',
        (gltf) => {
          if (this.model) {
            this.scene.remove(this.model);
          }
          this.model = gltf.scene;
          this.scene.add(this.model);

          const box = new Box3().setFromObject(this.model);
          const size = new Vector3();
          box.getSize(size);

          this.model.position.sub(new Vector3(0, 0, 0));

          this.controls.target.set(0, 0, 0);
          this.controls.update();
        },
        (error) => {
          // TODO: STORY-201 ERROR HANDLER
          console.error('Hiba történt a 3D modell feldolgozása közben:', error);
        }
      );
    };

    reader.onerror = (error) => {
      // TODO: STORY-201 ERROR HANDLER
      console.error('Hiba történt a fájl beolvasása közben:', error);
    };

    reader.readAsArrayBuffer(file);
  }

  public startRenderingLoop(): void {
    const component: FurniturePreview = this;
    (function render() {
      requestAnimationFrame(render);
      component.controls.update();
      component.renderer3d.render(component.scene, component.camera);
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
