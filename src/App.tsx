import { useState } from 'react';
import { LandingPage, type GltfAsset } from './pages/LandingPage';
import { EditorPage } from "./pages/EditorPage";
import './App.css';

export function App() {
  const [asset, setAsset] = useState<GltfAsset | null>(null);

  return (
    <div>
      <LandingPage onFileSelected={setAsset} />
      <EditorPage asset={asset} />
    </div>
  )
}