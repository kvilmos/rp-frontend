import { ElementRef, inject, Injectable, NgZone } from '@angular/core';
import { Blueprint } from './blueprint';
import { BlueprintScene } from './blueprint_scene';
import {
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { DESIGN } from '../../common/constant/planner.constant';
import { Floor } from './floor';
import { Edge } from './edge';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ControllerState, DesignController } from './builder_controller';
import { Subject, takeUntil } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DesignBuilder {
  public renderer!: WebGLRenderer;
  private canvas!: HTMLCanvasElement;
  private animationFrameId!: number;

  public camera!: PerspectiveCamera;
  public cameraController!: OrbitControls;

  private dirLight!: DirectionalLight;
  private ambientLight!: AmbientLight;

  private floorMeshes: Floor[] = [];
  private edgeMeshes: Edge[] = [];

  private destroy$ = new Subject<void>();
  public designController = inject(DesignController);
  private readonly scene = inject(BlueprintScene);
  private readonly blueprint = inject(Blueprint);
  private readonly zone = inject(NgZone);
  constructor() {}

  public start(canvasRef: ElementRef<HTMLCanvasElement>) {
    this.canvas = canvasRef.nativeElement;
    this.camera = new PerspectiveCamera(45, 1, 1, 10000);
    this.renderer = new WebGLRenderer({
      canvas: canvasRef.nativeElement,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.scene.getScene().background = DESIGN.BACKGROUND_COLOR_LIGHT;

    this.loadLights();
    this.loadBlueprint();

    this.cameraController = new OrbitControls(this.camera, this.canvas);
    this.cameraController.addEventListener('change', () => {
      for (let i = 0; i < this.floorMeshes.length; i++) {
        this.edgeMeshes[i].updateVisibility();
      }
    });

    this.camera.position.set(0, 2000, 0);
    this.handleResize();
    this.centerCamera();

    this.designController.init(canvasRef, this.renderer, this.camera, this.cameraController);

    this.blueprint.onUpdateRoom$
      .pipe()
      .pipe(takeUntil(this.destroy$))
      .subscribe((_) => {
        this.loadBlueprint();
        this.updateShadowCamera();
      });

    this.startRenderingLoop();
  }

  public loadLights(): void {
    this.ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.dirLight = new DirectionalLight(0xffffff, 1.5);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;

    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
    this.updateShadowCamera();
  }

  private updateShadowCamera(): void {
    const tol = 1;
    const height = 300;

    var size = this.blueprint.getSize();
    var d = (Math.max(size.z, size.x) + tol) / 2.0;

    var center = this.blueprint.getCenter();
    var pos = new Vector3(center.x, height, center.z);
    this.dirLight.position.copy(pos);
    this.dirLight.target.position.copy(center);

    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
  }

  public loadBlueprint(): void {
    for (let i = 0; i < this.floorMeshes.length; i++) {
      this.floorMeshes[i].removeFromScene();
    }
    for (let i = 0; i < this.edgeMeshes.length; i++) {
      this.edgeMeshes[i].remove();
    }
    this.floorMeshes = [];
    this.edgeMeshes = [];

    const rooms = this.blueprint.getRooms();
    for (let i = 0; i < rooms.length; i++) {
      const floor = new Floor(this.scene, rooms[i]);
      this.floorMeshes.push(floor);
      floor.addToScene();
    }

    const edges = this.blueprint.wallEdges();
    for (let i = 0; i < edges.length; i++) {
      const edge = new Edge(this.scene, edges[i], this.cameraController);
      this.edgeMeshes.push(edge);
    }
  }

  private centerCamera(): void {
    const yOffset = 1500.0;

    const pan = this.blueprint.getCenter();
    pan.y = yOffset;
    const distance = this.blueprint.getSize().z * 1.5;

    const offset = pan.clone().add(new Vector3(0, distance, distance));
    this.camera.position.copy(offset);

    this.cameraController.update();
  }

  public startRenderingLoop(): void {
    this.zone.runOutsideAngular(() => {
      const render = () => {
        this.renderer.render(this.scene.getScene(), this.camera);
        this.animationFrameId = requestAnimationFrame(render);
        this.cameraController.update();
      };
      render();
    });
  }

  public stopRenderingLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public handleResize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    }
    if (this.camera && this.renderer) {
    }
  }

  public setDesignTool(state: ControllerState): void {
    this.designController.switchState(state);
  }

  public getDesignTool(): ControllerState {
    return this.designController.state;
  }

  public onMouseMove(event: MouseEvent): void {
    this.designController.mouseMoveEvent(event);
  }

  public onMouseDown(): void {
    this.designController.mouseDownEvent();
  }

  public onMouseUp(): void {
    this.designController.mouseUpEvent();
  }

  public stop(): void {
    this.stopRenderingLoop();
    this.destroy$.next();
    this.destroy$.complete();
    this.cameraController?.dispose();
    this.renderer?.dispose();
    this.destroy$ = new Subject<void>();
  }
}
