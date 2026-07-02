import {
    PerspectiveCamera,
    Scene,
    TorusGeometry,
    MeshStandardMaterial,
    Mesh,
    PointLight,
    AmbientLight,
    WebGLRenderer,
    PointLightHelper,
    GridHelper
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { BaseScene } from "./BaseScene";

export class MainScene extends BaseScene {
    scene = new Scene();
    camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);

    // Scene Elements
    geometry = new TorusGeometry( 10, 3, 16, 100 );
    material = new MeshStandardMaterial({ color: 0xFF6347 });
    torus = new Mesh( this.geometry, this.material );
    pointLight = new PointLight(0xFFFFFF);
    ambientLight = new AmbientLight(0xFFFFFF);

    // Helpers
    pointLightHelper = new PointLightHelper(this.pointLight);
    gridHelper = new GridHelper(200, 50);

    // Contols
    private controls: OrbitControls;

    constructor(renderer: WebGLRenderer) {
        super();

        this.controls = new OrbitControls(this.camera, renderer.domElement);
        
        this.camera.position.setZ(50);
        this.pointLight.intensity = 100;

        this.scene.add(
            this.torus,
            this.pointLight,
            this.ambientLight,
            this.pointLightHelper,
            this.gridHelper
        );
    }

    update(delta: number): void {
        this.controls.update();
    }

}