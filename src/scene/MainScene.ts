import {
    PerspectiveCamera,
    Scene,
    DirectionalLight,
    WebGLRenderer,
    GridHelper,
    DirectionalLightHelper,
    AmbientLight
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { BaseScene } from "./BaseScene";
import { ActiveGLTFModelController } from "../controllers/ActiveGLTFModelController";

export class MainScene extends BaseScene {
    scene = new Scene();
    camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);

    // Scene Elements
    keyLight = new DirectionalLight(0xffffff, 2);
    fillLight = new DirectionalLight(0x99bbff, 0.5);
    rimLight = new DirectionalLight(0xffffff, 1);
    ambientLight = new AmbientLight(0xFFFFFF, 0.4);

    // Helpers
    keyLightHelper = new DirectionalLightHelper(this.keyLight)
    fillLightHelper = new DirectionalLightHelper(this.fillLight)
    rimLightHelper = new DirectionalLightHelper(this.rimLight)
    gridHelper = new GridHelper(200, 50);

    // Contols
    private controls: OrbitControls;

    // Controllers
    private activeModelController = new ActiveGLTFModelController(this.scene);

    constructor(renderer: WebGLRenderer) {
        super();

        this.controls = new OrbitControls(this.camera, renderer.domElement);
        
        this.camera.position.setZ(50);
        
        this.keyLight.position.set(10, 20, 10);
        this.fillLight.position.set(-10, 5, 5);
        this.rimLight.position.set(0, 10, -15);

        this.scene.add(
            this.keyLight,
            this.fillLight,
            this.rimLight,
            this.ambientLight,
            this.gridHelper,
            this.keyLightHelper,
            this.fillLightHelper,
            this.rimLightHelper,
        );

        this.activeModelController.load("assets/gltf-models/stylized_stone_cube/scene.gltf");
    }

    update(delta: number): void {
        this.controls.update();
    }

}