import { BufferAttribute, BufferGeometry, Plane, Vector2, Vector3 } from "three";

export interface SliceResult {
    positive: BufferGeometry | null;
    negative: BufferGeometry | null;
}

interface Vertex {
    position: Vector3;
    normal: Vector3;
    uv: Vector2;
    d: number; // signed distance to plane
}

interface Bucket {
    positions: number[];
    normals: number[];
    uvs: number[];
}

/**
 * Generic triangle-mesh/plane cutter. Accepts any BufferGeometry — no
 * knowledge of meshes, materials, scenes, or model-specific structure lives
 * here. Pure geometry in, geometry out.
 */
export class MeshCutter {
    /** Splits `geometry` by `plane` (in the geometry's own local space). Either side is null if empty. */
    cut(geometry: BufferGeometry, plane: Plane): SliceResult {
        const source = geometry.index ? geometry.toNonIndexed() : geometry;

        const posAttr = source.getAttribute("position");
        const normAttr = source.getAttribute("normal");
        const uvAttr = source.getAttribute("uv");

        const positive: Bucket = { positions: [], normals: [], uvs: [] };
        const negative: Bucket = { positions: [], normals: [], uvs: [] };

        const triangleCount = posAttr.count / 3;

        for (let i = 0; i < triangleCount; i++) {
            const ia = i * 3;
            const ib = ia + 1;
            const ic = ia + 2;

            const readVertex = (index: number): Vertex => {
                const position = new Vector3().fromBufferAttribute(posAttr, index);
                const normal = normAttr ? new Vector3().fromBufferAttribute(normAttr, index) : new Vector3(0, 1, 0);
                const uv = uvAttr ? new Vector2().fromBufferAttribute(uvAttr, index) : new Vector2();
                return { position, normal, uv, d: plane.distanceToPoint(position) };
            };

            this.clipTriangle(readVertex(ia), readVertex(ib), readVertex(ic), positive, negative);
        }

        console.log(positive);
        console.log(negative);

        return {
            positive: this.bucketToGeometry(positive),
            negative: this.bucketToGeometry(negative),
        };
    }

    /** Clips one triangle against the plane, routing pieces into the positive/negative buckets. */
    private clipTriangle(v0: Vertex, v1: Vertex, v2: Vertex, positive: Bucket, negative: Bucket) {
        const verts = [v0, v1, v2];
        const positiveCount = verts.filter((v) => v.d >= 0).length;

        if (positiveCount === 3) {
            this.pushVertex(positive, v0);
            this.pushVertex(positive, v1);
            this.pushVertex(positive, v2);
            return;
        }
        if (positiveCount === 0) {
            this.pushVertex(negative, v0);
            this.pushVertex(negative, v1);
            this.pushVertex(negative, v2);
            return;
        }

        // Straddles the plane — walk the triangle's edges, splitting where the sign changes.
        const posPoly: Vertex[] = [];
        const negPoly: Vertex[] = [];

        for (let i = 0; i < 3; i++) {
            const curr = verts[i];
            const next = verts[(i + 1) % 3];

            (curr.d >= 0 ? posPoly : negPoly).push(curr);

            const sameSide = curr.d >= 0 === next.d >= 0;
            if (!sameSide) {
                const t = curr.d / (curr.d - next.d);
                const intersection = this.lerpVertex(curr, next, t);
                posPoly.push(intersection);
                negPoly.push(intersection);
            }
        }

        this.triangulateFan(posPoly, positive);
        this.triangulateFan(negPoly, negative);
    }

    private lerpVertex(a: Vertex, b: Vertex, t: number): Vertex {
        return {
            position: a.position.clone().lerp(b.position, t),
            normal: a.normal.clone().lerp(b.normal, t).normalize(),
            uv: a.uv.clone().lerp(b.uv, t),
            d: 0,
        };
    }

    private triangulateFan(poly: Vertex[], bucket: Bucket) {
        for (let i = 1; i < poly.length - 1; i++) {
            this.pushVertex(bucket, poly[0]);
            this.pushVertex(bucket, poly[i]);
            this.pushVertex(bucket, poly[i + 1]);
        }
    }

    private pushVertex(bucket: Bucket, v: Vertex) {
        bucket.positions.push(v.position.x, v.position.y, v.position.z);
        bucket.normals.push(v.normal.x, v.normal.y, v.normal.z);
        bucket.uvs.push(v.uv.x, v.uv.y);
    }

    private bucketToGeometry(bucket: Bucket): BufferGeometry | null {
        if (bucket.positions.length === 0) return null;

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(bucket.positions), 3));
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(bucket.normals), 3));
        geometry.setAttribute("uv", new BufferAttribute(new Float32Array(bucket.uvs), 2));
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        return geometry;
    }
}