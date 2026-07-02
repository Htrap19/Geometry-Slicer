import { Timer, WebGLRenderer } from "three";
import { SceneManager } from "./SceneManager";

export class Engine {
    private timer = new Timer();

    constructor(
        private renderer: WebGLRenderer,
        private scenes: SceneManager
    ) {}

    start() {
        this.renderer.setAnimationLoop(this.update);
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    private update = () => {
        const delta = this.timer.getDelta();
        
        this.scenes.update(delta);
        this.scenes.render(this.renderer);
    }
}