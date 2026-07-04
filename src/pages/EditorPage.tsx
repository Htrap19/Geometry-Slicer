import { useEffect, useRef } from "react";
import { Vector2, WebGLRenderer, DefaultLoadingManager } from "three";
import { SceneManager } from "../core/SceneManager";
import { MainScene } from "../scene/MainScene";
import { Engine } from "../core/Engine";
import { CutManager, type CutGesture } from "../cutting/CutManager";
import type { GltfAsset } from "./LandingPage";

interface EditorPageProps {
    asset: GltfAsset | null;
    slicing: boolean;
    onCutGesture?: (gesture: CutGesture) => void;
}

export function EditorPage({ asset, slicing, onCutGesture }: EditorPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainSceneRef = useRef<MainScene | null>(null);
    const cutManagerRef = useRef<CutManager | null>(null);

    // Mount the renderer/engine exactly once.
    useEffect(() => {
        const renderer = new WebGLRenderer({
            canvas: canvasRef.current as unknown as HTMLCanvasElement,
            antialias: true,
        });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const mainScene = new MainScene(renderer);
        mainSceneRef.current = mainScene;

        // Assumes MainScene exposes .scene and .camera — adjust to your API.
        cutManagerRef.current = new CutManager(mainScene.scene, mainScene.camera);

        const sceneManager = new SceneManager(mainScene);
        const engine = new Engine(renderer, sceneManager);
        engine.start();

        return () => {
            engine.stop();
            renderer.dispose();
            mainSceneRef.current = null;
            cutManagerRef.current = null;
        };
    }, []);

    // Load whichever asset the landing page hands us, then register its
    // meshes with CutManager as cuttable parts.
    useEffect(() => {
        if (!asset || !mainSceneRef.current) return;

        DefaultLoadingManager.setURLModifier((url) => {
            for (const [key, blobUrl] of asset.resourceMap) {
                if (url.endsWith(key)) return blobUrl;
            }
            return url;
        });

        cutManagerRef.current?.reset(); // drop parts/lines belonging to any previous model

        mainSceneRef.current.activeModelController
            .load(asset.gltfUrl)
            .then(() => {
                const model = mainSceneRef.current?.activeModelController.getObject3D();
                if (model) cutManagerRef.current?.registerPart(model);
            })
            .catch((err: unknown) => console.error("Failed to load glTF:", err))
            .finally(() => {
                DefaultLoadingManager.setURLModifier((url) => url);
                URL.revokeObjectURL(asset.gltfUrl);
                asset.resourceMap.forEach((url) => URL.revokeObjectURL(url));
            });
    }, [asset]);

    // Forward raw pointer coordinates to CutManager — no cutting logic here.
    useEffect(() => {
        const canvas = canvasRef.current;
        const cutManager = cutManagerRef.current;
        if (!canvas || !slicing || !cutManager) return;

        const toNdc = (e: PointerEvent): Vector2 => {
            const rect = canvas.getBoundingClientRect();
            return new Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
        };

        const handleDown = (e: PointerEvent) => cutManager.begin(toNdc(e));
        const handleMove = (e: PointerEvent) => cutManager.update(toNdc(e));
        const handleUp = () => {
            const gesture = cutManager.end();
            if (gesture) onCutGesture?.(gesture);
        };

        canvas.addEventListener("pointerdown", handleDown);
        canvas.addEventListener("pointermove", handleMove);
        canvas.addEventListener("pointerup", handleUp);
        mainSceneRef.current?.setOrbitControlsEnabled(false);

        return () => {
            canvas.removeEventListener("pointerdown", handleDown);
            canvas.removeEventListener("pointermove", handleMove);
            canvas.removeEventListener("pointerup", handleUp);
            cutManager.cancel();
            cutManager.clearCommittedLines();
            mainSceneRef.current?.setOrbitControlsEnabled(true);
        };
    }, [slicing, onCutGesture]);

    return <canvas className="fixed top-0 left-0" ref={canvasRef} />;
}