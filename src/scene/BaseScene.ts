import { Camera, Scene } from "three";

export abstract class BaseScene {
    abstract scene: Scene
    abstract camera: Camera

    abstract update(delta: number): void;

    dispose() {}
}