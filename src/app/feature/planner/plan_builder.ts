import { ElementRef, inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { Blueprint } from './blueprint';
import { BlueprintScene } from './blueprint_scene';
import {
  CameraHelper,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  ImageUtils,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from 'three';
import { DESIGN } from '../../common/constants/planner-constants';
import { Floor } from './floor';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Edge } from './edge';

@Injectable({
  providedIn: 'root',
})
export class DesignBuilder implements OnDestroy {
  private renderer!: WebGLRenderer;
  private camera!: PerspectiveCamera;
  private animationFrameId!: number;
  private canvas!: HTMLCanvasElement;
  private controls!: OrbitControls;

  private dirLight!: DirectionalLight;
  private hemisphereLight!: HemisphereLight;

  private floorMeshes: Floor[] = [];
  private edgeMeshes: Edge[] = [];

  private readonly scene = inject(BlueprintScene);
  private readonly blueprint = inject(Blueprint);
  private readonly zone = inject(NgZone);

  constructor() {}

  public init(canvasRef: ElementRef<HTMLCanvasElement>) {
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
    this.scene.getScene().background = DESIGN.BACKGROUND_COLOR_LIGHT;

    // skyBox
    // controller

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.camera.position.set(0, 2000, 0);

    this.handleResize();
    this.centerCamera();

    this.blueprint.onUpdateRoom$.pipe().subscribe((data) => {
      console.log('onUpdateRoom', data);
      this.loadBlueprint();
      this.updateShadowCamera();
    });

    this.loadLights();
    this.loadBlueprint();

    this.controls.addEventListener('change', () => {
      for (let i = 0; i < this.floorMeshes.length; i++) {
        this.edgeMeshes[i].updateVisibility();
      }
    });

    this.startRenderingLoop();

    // mouse-canvas related controls
  }

  public loadLights(): void {
    const tol = 1;
    const height = 300;

    this.hemisphereLight = new HemisphereLight(0xffffff, 0x888888, 1.1);
    this.hemisphereLight.position.set(0, height, 0);
    this.scene.add(this.hemisphereLight);

    this.dirLight = new DirectionalLight(0xffffff, 0);
    this.dirLight.color.setHSL(1, 1, 0.1);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.far = tol + height;
    this.dirLight.shadow.bias = -0.0001;

    this.dirLight.visible = true;

    const helper = new CameraHelper(this.dirLight.shadow.camera);
    this.scene.add(helper);

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
      const edge = new Edge(this.scene, edges[i], this.controls);
      this.edgeMeshes.push(edge);
    }

    this.scene.needsUpdate = true;
  }

  private centerCamera() {
    const yOffset = 1500.0;

    const pan = this.blueprint.getCenter();
    pan.y = yOffset;
    const distance = this.blueprint.getSize().z * 1.5;

    var offset = pan.clone().add(new Vector3(0, distance, distance));
    this.camera.position.copy(offset);

    // this.controls.update();
  }

  public startRenderingLoop(): void {
    this.zone.runOutsideAngular(() => {
      const render = () => {
        this.renderer.render(this.scene.getScene(), this.camera);
        this.animationFrameId = requestAnimationFrame(render);
        this.controls.update();
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
      const width = parent.clientHeight;
      const height = parent.clientWidth;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
    if (this.camera && this.renderer) {
    }
  }

  public ngOnDestroy(): void {
    this.stopRenderingLoop();
  }
}
