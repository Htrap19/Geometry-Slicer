import { Object3D, Scene, Box3, Vector3 } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

export class ActiveGLTFModelController {
    private scene: Scene;
    private loader = new GLTFLoader();
    private current: Object3D | null = null;
    private currentGLTF: GLTF | null = null;
    private scaleUnits = 10;

    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    load(url: string): Promise<void> {
        const sceneName = url.substring(url.lastIndexOf("/") + 1);
        const parentPath = url.substring(0, url.lastIndexOf("/"));
    
        if (this.current) {
            this.scene.remove(this.current);
        }
        this.loader.setPath(parentPath + "/");
    
        return new Promise((resolve, reject) => {
            this.loader.load(
                sceneName,
                (data) => {
                    this.currentGLTF = data;
                    this.current = data.scene;
                    this.scene.add(this.current);
                    this.center(this.current);
                    resolve();
                },
                undefined,
                (err) => reject(err)
            );
        });
    }


    center(model: Object3D) {
        model.position.set(0, 0, 0);

        const box = new Box3().setFromObject(model);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());

        const maxAxis = Math.max(size.x, size.y, size.z);
        const scale = this.scaleUnits / maxAxis;

        // Scale first
        model.scale.setScalar(scale);

        // Recompute the bounding box after scaling
        box.setFromObject(model);
        box.getCenter(center);

        // Then center it
        model.position.sub(center);
    }

    getObject3D() {
        return this.current;
    }

    getGLTF() {
        return this.currentGLTF;
    }
}