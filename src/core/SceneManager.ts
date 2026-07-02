import { WebGLRenderer } from "three";
import { BaseScene } from "../scene/BaseScene";

export class SceneManager {
    constructor(private current: BaseScene) {}

    update(delta: number) {
        this.current.update(delta);
    }

    render(renderer: WebGLRenderer) {
        renderer.render(this.current.scene, this.current.camera);
    }

    set(scene: BaseScene) {
        this.current.dispose();
        this.current = scene;
    }
}