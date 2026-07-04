import {
    BufferGeometry,
    Camera,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    Object3D,
    Plane,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
} from "three";
import { MeshCutter } from "./MeshCutter";

export interface CutGesture {
    start: Vector3;
    end: Vector3;
}

export enum CutState {
    Idle = "idle",
    Dragging = "dragging",
}

/**
 * Owns all cut logic: drag state, the part registry, preview/committed
 * lines, plane construction, and dispatching to MeshCutter. UI and scene
 * setup code should never touch geometry or planes directly — only call
 * registerPart / begin / update / end / cancel / reset here.
 */
export class CutManager {
    private readonly cutter = new MeshCutter();
    private readonly raycaster = new Raycaster();
    private readonly parts = new Set<Mesh>();
    private readonly committedLines: Line[] = [];
    private previewLine: Line;

    private state: CutState = CutState.Idle;
    private startPoint: Vector3 | null = null;
    private endPoint: Vector3 | null = null;

    /** Fraction of a piece's bounding-sphere radius to pull the two halves apart after a cut. */
    private separationFactor = 0.15;

    constructor(private readonly scene: Scene, private readonly camera: Camera) {
        this.previewLine = this.createPreviewLine();
        this.scene.add(this.previewLine);
    }

    // ---- Part registration ---------------------------------------------

    /** Registers every mesh under `object` as cuttable. */
    registerPart(object: Object3D) {
        object.traverse((child) => {
            if (child instanceof Mesh) this.parts.add(child);
        });
    }

    /** Unregisters every mesh under `object`. */
    unregisterPart(object: Object3D) {
        object.traverse((child) => {
            if (child instanceof Mesh) this.parts.delete(child);
        });
    }

    /** Returns every currently registered part — for UI panels, debugging, etc. */
    getParts(): Mesh[] {
        return Array.from(this.parts);
    }

    /** How far apart (relative to a piece's own size) cut halves get pulled. Default 0.15. */
    setSeparation(factor: number) {
        this.separationFactor = factor;
    }

    /** Drops all registered parts and committed lines — call before loading a new model. */
    reset() {
        this.parts.clear();
        this.clearCommittedLines();
        this.cancel();
    }

    // ---- State machine --------------------------------------------------

    getState(): CutState {
        return this.state;
    }

    begin(ndc: Vector2) {
        const point = this.raycastParts(ndc);
        if (!point) return;

        this.state = CutState.Dragging;
        this.startPoint = point;
        this.endPoint = point.clone();
        this.previewLine.visible = true;
        this.updatePreviewLine();
    }

    update(ndc: Vector2) {
        if (this.state !== CutState.Dragging || !this.startPoint) return;

        const point = this.raycastParts(ndc);
        if (!point) return;

        this.endPoint = point;
        this.updatePreviewLine();
    }

    /** Ends the drag, performs the cut against all registered parts, and returns the gesture. */
    end(): CutGesture | null {
        if (this.state !== CutState.Dragging || !this.startPoint || !this.endPoint) {
            this.cancel();
            return null;
        }

        const gesture: CutGesture = { start: this.startPoint.clone(), end: this.endPoint.clone() };

        this.committedLines.push(this.previewLine);
        this.previewLine = this.createPreviewLine();
        this.scene.add(this.previewLine);

        this.performCut(gesture);

        this.state = CutState.Idle;
        this.startPoint = null;
        this.endPoint = null;

        return gesture;
    }

    /** Cancels an in-progress drag without committing a line or cutting anything. */
    cancel() {
        if (this.state === CutState.Dragging) {
            this.scene.remove(this.previewLine);
            this.previewLine.geometry.dispose();
            (this.previewLine.material as LineBasicMaterial).dispose();
            this.previewLine = this.createPreviewLine();
            this.scene.add(this.previewLine);
        }
        this.state = CutState.Idle;
        this.startPoint = null;
        this.endPoint = null;
    }

    /** Removes every committed cut line — call when exiting slicing mode. */
    clearCommittedLines() {
        for (const line of this.committedLines) {
            this.scene.remove(line);
            line.geometry.dispose();
            (line.material as LineBasicMaterial).dispose();
        }
        this.committedLines.length = 0;
    }

    // ---- Internals --------------------------------------------------------

    private raycastParts(ndc: Vector2): Vector3 | null {
        this.raycaster.setFromCamera(ndc, this.camera);
        const hit = this.raycaster.intersectObjects(Array.from(this.parts), false)[0];
        return hit ? hit.point.clone() : null;
    }

    private performCut(gesture: CutGesture) {
        const plane = this.buildCutPlane(gesture);

        for (const mesh of Array.from(this.parts)) {
            mesh.updateMatrixWorld(true);
            const localPlane = plane.clone().applyMatrix4(new Matrix4().copy(mesh.matrixWorld).invert());

            if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
            const sphere = mesh.geometry.boundingSphere;
            if (sphere) {
                const centerDist = localPlane.distanceToPoint(sphere.center);
                if (Math.abs(centerDist) > sphere.radius) continue; // plane can't touch this part
            }

            const { positive, negative } = this.cutter.cut(mesh.geometry, localPlane);

            if (positive && negative) {
                mesh.geometry.dispose();
                mesh.geometry = positive;

                const negativeMesh = new Mesh(negative, mesh.material);
                negativeMesh.position.copy(mesh.position);
                negativeMesh.rotation.copy(mesh.rotation);
                negativeMesh.scale.copy(mesh.scale);
                negativeMesh.name = `${mesh.name || "mesh"}_slice`;
                mesh.parent?.add(negativeMesh);

                this.parts.add(negativeMesh); // the new piece is cuttable too

                // Pull the two halves apart along the cut normal so the split is visible
                // rather than two coincident, overlapping pieces.
                const separationDir = localPlane.normal.clone().applyQuaternion(mesh.quaternion).normalize();
                const separation = (sphere?.radius ?? 1) * this.separationFactor;
                mesh.position.addScaledVector(separationDir, separation);
                negativeMesh.position.addScaledVector(separationDir, -separation);
            } else {
                positive?.dispose();
                negative?.dispose();
            }
        }
    }

    private buildCutPlane(gesture: CutGesture): Plane {
        const dragDir = gesture.end.clone().sub(gesture.start);
        if (dragDir.lengthSq() < 1e-8) dragDir.set(1, 0, 0); // degenerate drag guard

        const viewDir = new Vector3();
        this.camera.getWorldDirection(viewDir);

        const normal = new Vector3().crossVectors(dragDir, viewDir).normalize();
        return new Plane().setFromNormalAndCoplanarPoint(normal, gesture.start);
    }

    private createPreviewLine(): Line {
        const geometry = new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]);
        const material = new LineBasicMaterial({ color: 0x4d8dff, linewidth: 2 });
        const line = new Line(geometry, material);
        line.visible = false;
        line.renderOrder = 999;
        return line;
    }

    private updatePreviewLine() {
        if (!this.startPoint || !this.endPoint) return;
        this.previewLine.geometry.setFromPoints([this.startPoint, this.endPoint]);
    }
}