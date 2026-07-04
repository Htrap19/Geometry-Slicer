import { useEffect, useRef } from "react";
import { type GltfAsset } from "./LandingPage";
import { WebGLRenderer, DefaultLoadingManager } from "three";
import { SceneManager } from "../core/SceneManager";
import { MainScene } from "../scene/MainScene";
import { Engine } from "../core/Engine";

interface EditorPageProps {
    asset: GltfAsset | null
}

export function EditorPage({ asset }: EditorPageProps) {
    const canvasRef = useRef(null);
    const mainSceneRef = useRef<MainScene | null>(null);

    useEffect(() => {
        const renderer = new WebGLRenderer({
            canvas: canvasRef.current as unknown as HTMLCanvasElement,
            antialias: true
        });

        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const mainScene = new MainScene(renderer);
        mainSceneRef.current = mainScene;

        const sceneManager = new SceneManager(mainScene);
        const engine = new Engine(renderer, sceneManager);

        engine.start();

        return () => {
            engine.stop();
            renderer.dispose();
            mainSceneRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!asset || !mainSceneRef.current) return;

        // GLTFLoader composes requested resource URLs as
        // `resourcePath + relativeUri` (e.g. "blob:.../textures/foo.png"),
        // not the bare relative path — so match by suffix against our
        // resource map's keys rather than exact equality.
        DefaultLoadingManager.setURLModifier((url) => {
            for (const [key, blobUrl] of asset.resourceMap) {
                if (url.endsWith(key)) return blobUrl;
            }
            return url;
        });
    
        mainSceneRef.current.activeModelController
            .load(asset.gltfUrl)
            .catch((err: unknown) => console.error("Failed to load glTF:", err))
            .finally(() => {
                DefaultLoadingManager.setURLModifier((url) => url); // reset
                URL.revokeObjectURL(asset.gltfUrl);
                asset.resourceMap.forEach((url) => URL.revokeObjectURL(url));
        });

    }, [asset]);

    return (
        <canvas className="fixed top-0 left-0" ref={canvasRef} />
    )
}