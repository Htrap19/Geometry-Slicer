import './style.css';
import { WebGLRenderer } from "three";

import { Engine } from "./core/Engine";
import { SceneManager } from "./core/SceneManager";
import { MainScene } from "./scene/MainScene";

const renderer = new WebGLRenderer({
    canvas: document.getElementById("#mainCanvas") as HTMLCanvasElement,
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const sceneManager = new SceneManager(new MainScene(renderer));

const engine = new Engine(renderer, sceneManager);

engine.start();