# Geometry Slicer

Geometry Slicer is a web-based application built with **Three.js** that allows users to load a **GLTF** model and slice it using a cutting plane. The project is developed with **React**, **TypeScript**, and **Vite**.

---

## Demo Videos

### Demo 1 – metal_jerrycan_green
[▶ Watch Demo](./demo/Recording_2026-07-04_234555.mp4)

### Demo 2 – stylized_stone_cube
[▶ Watch Demo](./demo/Recording_2026-07-04_233443.mp4)

---

## Framework / Approach Used

The project uses **Three.js** as the 3D rendering framework.

The application is structured into separate modules to keep rendering, scene management, and slicing logic independent:

- `core/` – Engine and scene management  
- `scene/` – Scene setup and rendering  
- `controllers/` – Active model management  
- `cutting/` – Geometry slicing implementation  
- `pages/` – React pages for the UI  

---

## Shading Model

The project uses **Three.js** materials for rendering the loaded GLTF models. Since Three.js provides built-in physically based rendering (PBR) materials for GLTF assets, the rendering follows a **PBR workflow**.

---

## Geometry Slicing Approach

The slicing logic is implemented in the `cutting/` module using `MeshCutter` and `CutManager`.

The process works as follows:

1. **Cutting Plane**
   - A `THREE.Plane` defines the slicing surface in the mesh’s local space.

2. **Vertex Classification**
   - Each triangle’s vertices are tested against the plane using signed distance.
   - Vertices are marked as either positive or negative side.

3. **Triangle Clipping**
   - Triangles fully on one side are kept as-is.
   - Intersecting triangles are split by finding edge intersection points.
   - Vertex attributes (position, normal, UV) are interpolated.

4. **Rebuilding Geometry**
   - Clipped polygons are triangulated using a fan method.
   - Two new geometries are created:
     - Positive side mesh
     - Negative side mesh

This approach only performs mesh splitting and preserves original attributes where possible.

> **Note:** Cap geometry is not generated, so the cut surface remains open.

---

## Trade-offs

- **Model loading:** Users can load any local `.gltf` model instead of choosing from a predefined list. This removes the need for a separate Model / Shape Switcher.

- **Post-slice interaction:** Click-and-drag movement of sliced pieces is not implemented. Instead, the two halves are automatically separated by ~15% after slicing for better visual clarity.

- **UI focus:** The UI is functional but not fully polished due to time constraints, as the main focus was on implementing the core geometry slicing features.

---

## Known Issues

- No cap generation (open cut surfaces)
- May not handle complex or non-manifold meshes well
- Large GLTF models may need performance optimization

---

## Project Structure

```text
src/
├── assets/
├── controllers/
├── core/
├── cutting/
├── pages/
├── scene/
├── App.tsx
└── main.tsx
