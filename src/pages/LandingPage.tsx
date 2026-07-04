import { useEffect, useRef, useState } from "react";

const QUOTES = [
    { text: "Geometry is the archetype of the beauty of the world.", attr: "Johannes Kepler" },
    { text: "Where there is matter, there is geometry.", attr: "Johannes Kepler" },
    { text: "God ever geometrizes.", attr: "Plato" },
    { text: "A mathematician who is not also something of a poet will never be a perfect mathematician.", attr: "Karl Weierstrass" },
    { text: "There is no royal road to geometry.", attr: "Euclid" },
    { text: "There is geometry in the humming of the strings, there is music in the spacing of the spheres.", attr: "Pythagoras" },
    { text: "Nature's great book is written in the language of mathematics, with triangles and circles as its symbols.", attr: "Galileo Galilei" },
    { text: "Mathematics possesses not only truth, but supreme beauty.", attr: "Bertrand Russell" },
    { text: "If the solution is not beautiful, I know it is wrong.", attr: "R. Buckminster Fuller" },
    { text: "Geometry is the science of correct reasoning on incorrect figures.", attr: "George Pólya" },
];

export interface GltfAsset {
    gltfUrl: string;
    resourceMap: Map<string, string>;
}

interface LandingPageProps {
    onFileSelected: (asset: GltfAsset) => void;
}

export function LandingPage({ onFileSelected }: LandingPageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteVisible, setQuoteVisible] = useState(true);

    // webkitdirectory/directory aren't part of React's typed input props,
    // so they're set imperatively on mount.
    useEffect(() => {
        fileInputRef.current?.setAttribute("webkitdirectory", "");
        fileInputRef.current?.setAttribute("directory", "");
    }, []);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) return;

        const id = setInterval(() => {
            setQuoteVisible(false);
            setTimeout(() => {
                setQuoteIndex((i) => (i + 1) % QUOTES.length);
                setQuoteVisible(true);
            }, 500);
        }, 6500);

        return () => clearInterval(id);
    }, []);

    const handleStart = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return; // user cancelled the dialog

        const gltfFile = files.find((f) => f.name.toLowerCase().endsWith(".gltf"));
        if (!gltfFile) {
            setError("No .gltf file found in that folder.");
            return;
        }
        setError(null);

        const relPathOf = (f: File) =>
            "webkitRelativePath" in f && (f as any).webkitRelativePath
                ? (f as any).webkitRelativePath
                : f.name;

        const gltfPath = relPathOf(gltfFile);
        const gltfDir = gltfPath.includes("/")
            ? gltfPath.slice(0, gltfPath.lastIndexOf("/") + 1)
            : "";

        const resourceMap = new Map<string, string>();
        for (const f of files) {
            if (f === gltfFile) continue;
            const rel = relPathOf(f);
            const key = rel.startsWith(gltfDir) ? rel.slice(gltfDir.length) : rel;
            resourceMap.set(key, URL.createObjectURL(f));
        }

        setLoading(true);
        setHidden(true);

        const gltfUrl = URL.createObjectURL(gltfFile);

        // Give the fade-out a moment to play, then hand the asset to the
        // parent, which passes it into <EditorPage asset={asset} />.
        window.setTimeout(() => {
            onFileSelected({ gltfUrl, resourceMap });
        }, 500);
    };

    const quote = QUOTES[quoteIndex];

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-neutral-50/70 dark:bg-neutral-950/70 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 px-6 transition-opacity duration-500 ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
        >
            <style>{`
        @keyframes cube-spin {
          from { transform: rotateX(-24deg) rotateY(0deg); }
          to   { transform: rotateX(-24deg) rotateY(360deg); }
        }
        .cube-spin { animation: cube-spin 16s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cube-spin { animation: none; transform: rotateX(-24deg) rotateY(28deg); }
        }
      `}</style>

            {/* Rotating wireframe cube */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 perspective-[900px]">
                <div className="cube-spin relative w-full h-full transform-3d">
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:translateZ(64px)]" />
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:translateZ(-64px)_rotateY(180deg)]" />
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:rotateY(90deg)_translateZ(64px)]" />
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:rotateY(-90deg)_translateZ(64px)]" />
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:rotateX(90deg)_translateZ(64px)]" />
                    <div className="absolute inset-0 border border-neutral-400/60 dark:border-neutral-100/40 bg-blue-500/10 [transform:rotateX(-90deg)_translateZ(64px)]" />
                </div>
            </div>

            <h1 className="font-semibold text-3xl sm:text-4xl md:text-5xl tracking-tight text-center max-w-xs sm:max-w-md">
                Geometry Slicer
            </h1>

            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 text-center max-w-md leading-relaxed -mt-2">
                Import a glTF scene and slice through it
            </p>

            <button
                onClick={handleStart}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-progress text-white font-semibold text-sm px-10 py-3.5 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
                <span>{loading ? "Loading scene…" : "Start"}</span>
                {!loading && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                )}
            </button>

            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 -mt-3">
                select the model's folder
            </span>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
            />

            {error && (
                <p className="font-mono text-xs text-red-500 dark:text-red-400 -mt-2">{error}</p>
            )}

            <div
                className="mt-2 max-w-md text-center min-h-11 transition-opacity duration-500"
                style={{ opacity: quoteVisible ? 1 : 0 }}
            >
                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    "{quote.text}"
                </p>
                <p className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">
                    — {quote.attr}
                </p>
            </div>
        </div>
    );
}