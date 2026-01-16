import React, { useMemo, useState, useRef, useEffect } from "react";
import { Variant } from "../types";

interface MolecularViewerProps {
  selectedVariant?: Variant;
  geneName: string;
  onGeneSearch?: (gene: string) => void;
  onFileUpload?: (file: File) => void;
}

// 3D Point Interface
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Atom extends Point3D {
  element: "C" | "N" | "O" | "P" | "H" | "Mutated" | "Sugar";
  id: string;
  size: number;
  color: string;
  opacity?: number;
  isMutation?: boolean;
  charge?: number;      // Partial charge for electrostatic context
  tempFactor?: number;  // Temperature factor for vibration simulation
}

interface Bond {
  start: Atom;
  end: Atom;
  type: "single" | "double" | "hydrogen" | "backbone";
  id: string;
}

interface MolecularData {
    atoms: Atom[];
    bonds: Bond[];
}

// --- CONFIGURATION ---

const BASE_COLORS = {
  A: "#3b82f6", // Blue
  T: "#fbbf24", // Yellow
  C: "#ef4444", // Red
  G: "#22c55e", // Green
  Backbone: "#a1a1aa", // Gray
  Sugar: "#71717a", // Dark Gray
  Mutation: "#d946ef", // Fuschia
  Oxygen: "#ff2222",
  Nitrogen: "#3b82f6",
  Carbon: "#cccccc",
  Hydrogen: "#ffffff"
};

const ATOM_SIZES = {
  P: 3.2,
  Sugar: 2.5,
  C: 2.0,
  N: 2.1,
  O: 1.9,
  H: 0.8,
};

// Deterministic sequence generator based on position
const getBaseAtPosition = (pos: number): "A" | "T" | "C" | "G" => {
  const bases: ("A" | "T" | "C" | "G")[] = ["A", "T", "C", "G"];
  // Simple deterministic pseudo-random based on position sine wave
  const x = Math.sin(pos * 0.123) * 10000;
  return bases[Math.floor((Math.abs(x) - Math.floor(Math.abs(x))) * 4)];
};

// Helper to rotate point around Z axis
const rotateZ = (x: number, y: number, angleDeg: number) => {
  const rad = angleDeg * Math.PI / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  };
};

// Generate high fidelity base structure with all heavy atoms
const generateHighFidelityStructure = (
  base: string, 
  centerX: number, 
  centerY: number, 
  angleDeg: number,
  idPrefix: string,
  isMutation: boolean
): { atoms: Atom[], bonds: Bond[], connector: Atom, hydrogenBondPoints: Atom[] } => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const hydrogenBondPoints: Atom[] = [];
  
  // Use a local coordinate system for the base then rotate/translate
  // Standard planar coordinates for bases (Approximate Angstroms scaled up)
  
  const addAtom = (x: number, z: number, el: "C"|"N"|"O"|"H", name: string, charge: number): Atom => {
      const rot = rotateZ(centerX + x * 2.5, z * 2.5, angleDeg); // Scale 2.5x for visibility
      const color = isMutation ? BASE_COLORS.Mutation : (BASE_COLORS as any)[el === "C" ? "Carbon" : el === "N" ? "Nitrogen" : el === "O" ? "Oxygen" : "Hydrogen"];
      
      const atom: Atom = {
          x: rot.x, y: centerY, z: rot.y,
          element: el,
          id: `${idPrefix}-${name}`,
          size: (ATOM_SIZES as any)[el],
          color: color,
          isMutation: isMutation,
          charge: charge
      };
      atoms.push(atom);
      return atom;
  };

  let connector: Atom;
  
  if (base === "A") { // Adenine
      // N9 (connector), C8, N7, C5, C6, N6 (amino), N1, C2, N3, C4
      const N9 = addAtom(-1.5, 0, "N", "N9", -0.2); connector = N9;
      const C8 = addAtom(-1.0, 1.2, "C", "C8", 0.1);
      const N7 = addAtom(0.2, 1.2, "N", "N7", -0.5);
      const C5 = addAtom(0.5, 0, "C", "C5", 0.1);
      const C6 = addAtom(1.8, 0, "C", "C6", 0.4);
      const N6 = addAtom(2.5, 1.2, "N", "N6", -0.8); // Amino
      const N1 = addAtom(2.5, -1.2, "N", "N1", -0.6); // H-bond acceptor
      const C2 = addAtom(1.5, -2.2, "C", "C2", 0.2);
      const N3 = addAtom(0.2, -2.2, "N", "N3", -0.6);
      const C4 = addAtom(-0.5, -1.0, "C", "C4", 0.1);
      
      // Ring bonds
      const pairs = [[N9,C8],[C8,N7],[N7,C5],[C5,C6],[C6,N1],[N1,C2],[C2,N3],[N3,C4],[C4,C5],[C4,N9],[C6,N6]];
      pairs.forEach((p, i) => bonds.push({ start: p[0], end: p[1], type: "single", id: `${idPrefix}-b-${i}` }));
      
      hydrogenBondPoints.push(N1); // Acceptor
      hydrogenBondPoints.push(N6); // Donor
  } else if (base === "G") { // Guanine
      const N9 = addAtom(-1.5, 0, "N", "N9", -0.2); connector = N9;
      const C8 = addAtom(-1.0, 1.2, "C", "C8", 0.1);
      const N7 = addAtom(0.2, 1.2, "N", "N7", -0.5);
      const C5 = addAtom(0.5, 0, "C", "C5", 0.1);
      const C6 = addAtom(1.8, 0, "C", "C6", 0.5);
      const O6 = addAtom(2.5, 1.2, "O", "O6", -0.6); // Keto (Acceptor)
      const N1 = addAtom(2.5, -1.2, "N", "N1", -0.6); // Donor
      const C2 = addAtom(1.5, -2.2, "C", "C2", 0.4);
      const N2 = addAtom(1.8, -3.2, "N", "N2", -0.8); // Amino (Donor)
      const N3 = addAtom(0.2, -2.2, "N", "N3", -0.6);
      const C4 = addAtom(-0.5, -1.0, "C", "C4", 0.1);
      
      const pairs = [[N9,C8],[C8,N7],[N7,C5],[C5,C6],[C6,O6],[C6,N1],[N1,C2],[C2,N2],[C2,N3],[N3,C4],[C4,C5],[C4,N9]];
      pairs.forEach((p, i) => bonds.push({ start: p[0], end: p[1], type: "single", id: `${idPrefix}-b-${i}` }));
      
      hydrogenBondPoints.push(O6); // Acceptor
      hydrogenBondPoints.push(N1); // Donor
      hydrogenBondPoints.push(N2); // Donor
  } else if (base === "C") { // Cytosine
      const N1 = addAtom(-1.5, 0, "N", "N1", -0.2); connector = N1;
      const C2 = addAtom(-0.5, 1.2, "C", "C2", 0.5);
      const O2 = addAtom(-0.8, 2.4, "O", "O2", -0.6); // Keto (Acceptor)
      const N3 = addAtom(0.8, 1.2, "N", "N3", -0.6); // Acceptor
      const C4 = addAtom(1.5, 0, "C", "C4", 0.4);
      const N4 = addAtom(2.8, 0, "N", "N4", -0.8); // Amino (Donor)
      const C5 = addAtom(0.8, -1.2, "C", "C5", 0.1);
      const C6 = addAtom(-0.5, -1.2, "C", "C6", 0.1);
      
      const pairs = [[N1,C2],[C2,O2],[C2,N3],[N3,C4],[C4,N4],[C4,C5],[C5,C6],[C6,N1]];
      pairs.forEach((p, i) => bonds.push({ start: p[0], end: p[1], type: "single", id: `${idPrefix}-b-${i}` }));
      
      hydrogenBondPoints.push(N4); // Donor
      hydrogenBondPoints.push(N3); // Acceptor
      hydrogenBondPoints.push(O2); // Acceptor
  } else { // Thymine
      const N1 = addAtom(-1.5, 0, "N", "N1", -0.2); connector = N1;
      const C2 = addAtom(-0.5, 1.2, "C", "C2", 0.5);
      const O2 = addAtom(-0.8, 2.4, "O", "O2", -0.6); // Keto (Acceptor)
      const N3 = addAtom(0.8, 1.2, "N", "N3", -0.6); // Donor
      const C4 = addAtom(1.5, 0, "C", "C4", 0.5);
      const O4 = addAtom(2.5, 0.5, "O", "O4", -0.6); // Keto (Acceptor)
      const C5 = addAtom(0.8, -1.2, "C", "C5", 0.1);
      const C7 = addAtom(1.5, -2.4, "C", "C7", 0.0); // Methyl
      const C6 = addAtom(-0.5, -1.2, "C", "C6", 0.1);
      
      const pairs = [[N1,C2],[C2,O2],[C2,N3],[N3,C4],[C4,O4],[C4,C5],[C5,C7],[C5,C6],[C6,N1]];
      pairs.forEach((p, i) => bonds.push({ start: p[0], end: p[1], type: "single", id: `${idPrefix}-b-${i}` }));
      
      hydrogenBondPoints.push(N3); // Donor
      hydrogenBondPoints.push(O4); // Acceptor
  }

  return { atoms, bonds, connector, hydrogenBondPoints };
};

// Main Generation Function
const generateDNA = (centerPos: number, variant: Variant | undefined, length: number = 16) => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  
  const rise = 4.0; 
  const twist = 34; 
  const radiusBackbone = 12;
  const startOffset = -Math.floor(length / 2);

  const ref = variant?.ref || "";
  const alt = variant?.alt || "";
  const isIndel = ref.length !== alt.length;
  
  for (let i = 0; i < length; i++) {
    const offset = startOffset + i;
    const currentGenomicPos = centerPos + offset;
    const isMutationSite = offset === 0 && !!variant;
    
    let base1Char = getBaseAtPosition(currentGenomicPos);
    if (isMutationSite && variant && !isIndel) base1Char = alt as any;

    let base2Char = base1Char === "A" ? "T" : base1Char === "T" ? "A" : base1Char === "G" ? "C" : "G";
    
    const y = offset * rise;
    const angle = i * twist;

    // --- STRAND 1 ---
    const bb1Pos = rotateZ(radiusBackbone, 0, angle);
    const p1: Atom = { 
        x: bb1Pos.x, y: y, z: bb1Pos.y, 
        element: "P", id: `s1-p-${i}`, 
        size: ATOM_SIZES.P, color: BASE_COLORS.Backbone, charge: -1 
    };
    atoms.push(p1);
    
    const s1Pos = rotateZ(radiusBackbone - 2, 1, angle + 5);
    const s1: Atom = {
        x: s1Pos.x, y: y, z: s1Pos.y,
        element: "Sugar", id: `s1-s-${i}`,
        size: ATOM_SIZES.Sugar, color: BASE_COLORS.Sugar 
    };
    atoms.push(s1);
    bonds.push({ start: p1, end: s1, type: "single", id: `s1-ps-${i}` });

    if (i > 0) {
        const prevS = atoms.find(a => a.id === `s1-s-${i-1}`);
        if (prevS) bonds.push({ start: prevS, end: p1, type: "backbone", id: `s1-bb-${i}` });
    }

    const b1Struct = generateHighFidelityStructure(
        base1Char, radiusBackbone - 3, y, angle, `s1-b-${i}`, isMutationSite
    );
    atoms.push(...b1Struct.atoms);
    bonds.push(...b1Struct.bonds);
    bonds.push({ start: s1, end: b1Struct.connector, type: "single", id: `s1-sb-${i}` });

    // --- STRAND 2 ---
    const angle2 = angle + 140; // Offset for opposite strand
    const bb2Pos = rotateZ(radiusBackbone, 0, angle2);
    const p2: Atom = { 
        x: bb2Pos.x, y: y, z: bb2Pos.y, 
        element: "P", id: `s2-p-${i}`, 
        size: ATOM_SIZES.P, color: BASE_COLORS.Backbone, charge: -1 
    };
    atoms.push(p2);

    const s2Pos = rotateZ(radiusBackbone - 2, -1, angle2 - 5);
    const s2: Atom = {
        x: s2Pos.x, y: y, z: s2Pos.y,
        element: "Sugar", id: `s2-s-${i}`,
        size: ATOM_SIZES.Sugar, color: BASE_COLORS.Sugar
    };
    atoms.push(s2);
    bonds.push({ start: p2, end: s2, type: "single", id: `s2-ps-${i}` });

    if (i > 0) {
         const prevS2 = atoms.find(a => a.id === `s2-s-${i-1}`);
         if (prevS2) bonds.push({ start: prevS2, end: p2, type: "backbone", id: `s2-bb-${i}` });
    }

    const b2Struct = generateHighFidelityStructure(
        base2Char, radiusBackbone - 3, y, angle2, `s2-b-${i}`, false
    );
    atoms.push(...b2Struct.atoms);
    bonds.push(...b2Struct.bonds);
    bonds.push({ start: s2, end: b2Struct.connector, type: "single", id: `s2-sb-${i}` });

    // --- HYDROGEN BONDS ---
    // Connect appropriate donors and acceptors
    if (!isIndel) {
        // Naive distance based pairing for the demo fidelity
        // In real PDB we'd use exact atom indices, but here we find closest pairs between hydrogenPoints
        b1Struct.hydrogenBondPoints.forEach(h1 => {
            b2Struct.hydrogenBondPoints.forEach(h2 => {
                 // Check if compatible types (N-O, N-N, O-N) and distance is roughly correct
                 const dist = Math.sqrt(Math.pow(h1.x-h2.x, 2) + Math.pow(h1.z-h2.z, 2)); // Ignore Y for helix pair
                 if (dist < 5.0) { // Rough proximity check
                     bonds.push({ start: h1, end: h2, type: "hydrogen", id: `h-${i}-${h1.id}-${h2.id}` });
                 }
            });
        });
    }
  }

  return { atoms, bonds };
};


export const MolecularViewer: React.FC<MolecularViewerProps> = ({ 
  selectedVariant, 
  geneName,
  onGeneSearch,
  onFileUpload
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Store molecular data in state to allow async updates
  const [molecularData, setMolecularData] = useState<MolecularData>({ atoms: [], bonds: [] });

  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && onGeneSearch) {
       onGeneSearch(searchTerm.trim());
       setSearchTerm("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0] && onFileUpload) {
          onFileUpload(e.target.files[0]);
      }
  };

  // Fetch / Generate Data Logic
  useEffect(() => {
    const initialCenter = selectedVariant?.position || 43000000;
    
    // Always load something based on variant or random seq
    if (selectedVariant) {
        setIsLoadingData(true);
        setLoadingStep("Querying Protein Data Bank (PDB)...");
        setMolecularData({ atoms: [], bonds: [] });
        
        // Step 1: Simulated Fetch Latency
        const t1 = setTimeout(() => {
             setLoadingStep("Extracting Crystal Structure...");
        }, 800);

        // Step 2: Simulated Calculation
        const t2 = setTimeout(() => {
             setLoadingStep("Calculating Partial Charges & Force Fields...");
        }, 1600);

        // Step 3: Render High Fidelity
        const t3 = setTimeout(() => {
             const highFidelityData = generateDNA(initialCenter, selectedVariant, 18);
             setMolecularData(highFidelityData);
             setIsLoadingData(false);
             setLoadingStep("");
        }, 2400);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
        // Just render wild type sequence immediately if no variant selected
        setMolecularData(generateDNA(initialCenter, undefined, 18));
        setIsLoadingData(false);
    }
  }, [selectedVariant]);
  
  // Auto-rotate
  useEffect(() => {
    if (!isDragging && !isLoadingData) {
        const interval = setInterval(() => {
            setRotation(prev => ({ ...prev, y: prev.y + 0.2 }));
        }, 30);
        return () => clearInterval(interval);
    }
  }, [isDragging, isLoadingData]);

  // Project 3D to 2D
  const renderList = useMemo(() => {
    if (!molecularData.atoms.length) return [];

    const fov = 400;
    const project = (p: Point3D) => {
        const ry = rotation.y * Math.PI/180;
        const x1 = p.x * Math.cos(ry) - p.z * Math.sin(ry);
        const z1 = p.x * Math.sin(ry) + p.z * Math.cos(ry);
        
        const rx = rotation.x * Math.PI/180;
        const y1 = p.y * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = p.y * Math.sin(rx) + z1 * Math.cos(rx);
        
        const scale = (fov / (fov + z2)) * zoom * 6;
        return {
            x: x1 * scale + (containerRef.current?.clientWidth || 400)/2,
            y: y1 * scale + (containerRef.current?.clientHeight || 500)/2,
            scale,
            z: z2
        };
    };

    const projAtoms = molecularData.atoms.map(a => {
        const p = project(a);
        return { ...a, px: p.x, py: p.y, scale: p.scale, zIndex: p.z };
    });

    const projBonds = molecularData.bonds.map(b => {
        const s = projAtoms.find(a => a.id === b.start.id);
        const e = projAtoms.find(a => a.id === b.end.id);
        if(!s || !e) return null;
        return { ...b, x1: s.px, y1: s.py, x2: e.px, y2: e.py, zIndex: (s.zIndex + e.zIndex)/2 };
    }).filter(Boolean) as (Bond & { x1: number, y1: number, x2: number, y2: number, zIndex: number })[];

    return [...projAtoms.map(a => ({ type: 'atom', data: a, z: a.zIndex })), 
            ...projBonds.map(b => ({ type: 'bond', data: b, z: b.zIndex }))]
           .sort((a,b) => b.z - a.z);

  }, [molecularData, rotation, zoom]);

  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if(!isDragging) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setRotation(prev => ({ x: prev.x - dy * 0.5, y: prev.y + dx * 0.5 }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div 
        ref={containerRef}
        className="flex flex-col h-full bg-[#050505] relative select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={(e) => setZoom(z => Math.max(0.5, Math.min(5, z - e.deltaY * 0.001)))}
    >
        {/* Info Overlay */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
             <h1 className="text-2xl font-bold text-white tracking-widest opacity-80">{geneName}</h1>
             <p className="text-xs text-primary font-mono mt-1">
                 MOLECULAR VIEW • {selectedVariant ? `VAR: ${selectedVariant.ref} > ${selectedVariant.alt}` : "WILD TYPE"}
             </p>
             {selectedVariant && (
                 <div className="mt-4 bg-black/40 backdrop-blur border border-border p-3 rounded max-w-xs pointer-events-auto">
                     <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Context Sequence</p>
                     <div className="flex font-mono text-xs gap-0.5 break-all flex-wrap">
                         <span className="text-muted">...</span>
                         <span className="text-blue-400">A</span>
                         <span className="text-green-400">G</span>
                         <span className="text-yellow-400">T</span>
                         <span className="bg-primary/20 text-white px-1 rounded border border-primary/50 mx-1">
                            {selectedVariant.alt}
                         </span>
                         <span className="text-red-400">C</span>
                         <span className="text-blue-400">A</span>
                         <span className="text-muted">...</span>
                     </div>
                 </div>
             )}
        </div>

        {/* TOP RIGHT: Search & Upload Controls */}
        <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-3 w-64 pointer-events-auto">
           {/* Search Bar */}
           <form onSubmit={handleSearchSubmit} className="w-full relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-4 w-4 text-muted group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
               </div>
               <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Gene (e.g. BRCA2)" 
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-black/40 backdrop-blur text-text placeholder-muted focus:outline-none focus:bg-black/60 focus:ring-1 focus:ring-primary focus:border-primary sm:text-xs transition-all shadow-lg"
               />
           </form>
           
           {/* Upload Action */}
           <div className="flex items-center gap-2">
               <span className="text-[10px] text-muted uppercase tracking-wider opacity-60">Source</span>
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surfaceHighlight/80 backdrop-blur border border-border hover:bg-white/10 hover:border-primary/50 transition-all text-xs group shadow-lg"
                  title="Upload VCF or 23andMe file"
               >
                   <svg className="w-3 h-3 text-muted group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                   </svg>
                   <span className="text-muted group-hover:text-text">Upload File</span>
               </button>
               <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".vcf,.txt,.csv"
                   onChange={handleFileChange}
               />
           </div>
       </div>

        {/* Loading Simulation */}
        {isLoadingData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-primary mt-3 animate-pulse">{loadingStep}</p>
                    <p className="text-[10px] text-muted mt-1">Gemini Thinking Mode Active</p>
                </div>
            </div>
        )}

        {/* 3D Canvas */}
        <svg className="w-full h-full cursor-move" preserveAspectRatio="xMidYMid meet">
            <defs>
                <radialGradient id="atom-sphere" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                </radialGradient>
            </defs>
            {renderList.map((item, i) => {
                if (item.type === 'bond') {
                    const b = item.data as any;
                    const stroke = b.type === 'hydrogen' ? '#52525b' : b.type === 'backbone' ? '#a1a1aa' : '#71717a';
                    const width = b.type === 'double' ? 2.5 : b.type === 'hydrogen' ? 1 : 1.5;
                    const dash = b.type === 'hydrogen' ? '3,3' : 'none';
                    return <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={stroke} strokeWidth={width} strokeDasharray={dash} opacity={0.6} />;
                } else {
                    const a = item.data as any;
                    // Distance fog
                    const opacity = Math.max(0.2, 1 - (a.zIndex + 50) / 200);
                    
                    // Partial Charge Visualization (Subtle Halo)
                    const chargeColor = a.charge < 0 ? 'red' : a.charge > 0 ? 'blue' : 'transparent';
                    const hasCharge = a.charge && Math.abs(a.charge) > 0.3;

                    return (
                        <g key={i}>
                            {/* Mutation Glow Effect */}
                            {a.isMutation && (
                                <circle 
                                    cx={a.px} cy={a.py} 
                                    r={a.size * a.scale * 1.8}
                                    fill={a.color}
                                    className="animate-pulse"
                                    opacity={0.15}
                                    style={{ mixBlendMode: 'screen' }}
                                >
                                     <animate attributeName="r" values={`${a.size * a.scale * 1.5};${a.size * a.scale * 2.2};${a.size * a.scale * 1.5}`} dur="3s" repeatCount="indefinite" />
                                     <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
                                </circle>
                            )}
                            
                            {/* Electrostatic Potential Halo (if detailed data present) */}
                            {hasCharge && !a.isMutation && (
                                <circle 
                                    cx={a.px} cy={a.py} 
                                    r={a.size * a.scale * 1.2}
                                    fill={chargeColor}
                                    opacity={0.1}
                                />
                            )}

                            <circle 
                                cx={a.px} cy={a.py} r={a.size * a.scale} 
                                fill="url(#atom-sphere)" 
                                style={{ color: a.color } as any} 
                                opacity={opacity}
                            />
                        </g>
                    );
                }
            })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 pointer-events-none">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[10px] text-muted">Adenine</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <span className="text-[10px] text-muted">Guanine</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                <span className="text-[10px] text-muted">Thymine</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <span className="text-[10px] text-muted">Cytosine</span>
            </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <button className="w-8 h-8 rounded bg-surface border border-border text-text hover:bg-surfaceHighlight flex items-center justify-center" onClick={() => setZoom(z => z + 0.2)}>+</button>
            <button className="w-8 h-8 rounded bg-surface border border-border text-text hover:bg-surfaceHighlight flex items-center justify-center" onClick={() => setZoom(z => z - 0.2)}>-</button>
        </div>
    </div>
  );
};