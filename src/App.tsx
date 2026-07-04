import { useState } from 'react';
import { LandingPage, type GltfAsset } from './pages/LandingPage';
import { EditorPage } from "./pages/EditorPage";
import './App.css';

export function App() {
    const [asset, setAsset] = useState<GltfAsset | null>(null);
    const [slicing, setSlicing] = useState(false);

    return (
        <div>
            <LandingPage onFileSelected={setAsset} />
            <EditorPage
                asset={asset}
                slicing={slicing}
                onCutGesture={(gesture) => {
                    console.log("cut gesture", gesture);
                }}
            />
            {asset && (
                <button
                    onClick={() => setSlicing((s) => !s)}
                    className="fixed bottom-6 left-6 z-40 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 shadow-lg">
                    {slicing ? "Exit slicing" : "Slice"}
                </button>
            )}

        </div>
    )
}