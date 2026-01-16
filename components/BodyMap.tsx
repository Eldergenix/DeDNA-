import React, { useMemo, useState, useEffect } from "react";

interface BodyMapProps {
  highlightedOrgans?: string[];
}

export const BodyMap: React.FC<BodyMapProps> = ({ highlightedOrgans = [] }) => {
  const [rotation, setRotation] = useState(0);

  // Subtle breathing/rotation animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Detailed Anatomical Paths for the "Glass" Look
  // Coordinates are designed for a 200x500 viewBox
  const ORGAN_PATHS: Record<string, { d: string; cx: number; cy: number; label: string; color: string }> = {
    brain: {
      d: "M100,32 C115,32 122,42 120,58 C118,72 110,80 100,80 C90,80 82,72 80,58 C78,42 85,32 100,32 M100,32 V80 M80,55 Q100,60 120,55 M85,45 Q100,50 115,45",
      cx: 100, cy: 56, label: "Brain", color: "#ec4899" // Pink
    },
    lungs: {
      d: "M88,105 C75,105 70,120 70,145 C70,165 75,170 92,165 C95,150 95,120 88,105 M112,105 C125,105 130,120 130,145 C130,165 125,170 108,165 C105,150 105,120 112,105",
      cx: 100, cy: 135, label: "Lungs", color: "#3b82f6" // Blue
    },
    heart: {
      d: "M105,135 C100,125 92,130 92,142 C92,155 105,165 112,155 C116,148 112,132 105,135 M102,135 V155 M92,142 H110",
      cx: 102, cy: 145, label: "Heart", color: "#ef4444" // Red
    },
    breasts: {
      d: "M72,145 Q82,145 86,155 Q82,168 72,168 Q62,168 58,155 Q62,145 72,145 M128,145 Q138,145 142,155 Q138,168 128,168 Q118,168 114,155 Q118,145 128,145",
      cx: 100, cy: 155, label: "Breasts", color: "#f472b6" // Pink-ish
    },
    pancreas: {
      d: "M95,178 Q110,172 118,180 Q110,190 95,186 L90,182 Z",
      cx: 105, cy: 180, label: "Pancreas", color: "#eab308" // Yellow
    },
    colon: {
      d: "M78,195 H122 V205 H128 V230 H122 V240 H78 V230 H72 V205 H78 Z M88,205 H112 V230 H88 Z",
      cx: 100, cy: 218, label: "Colon", color: "#8b5cf6" // Purple
    },
    ovaries: {
      d: "M70,245 C65,245 65,255 70,255 C75,255 75,245 70,245 M130,245 C125,245 125,255 130,255 C135,255 135,245 130,245 M75,250 Q100,265 125,250",
      cx: 100, cy: 250, label: "Ovaries", color: "#ec4899"
    },
    prostate: {
      d: "M96,265 Q100,260 104,265 Q100,275 96,265",
      cx: 100, cy: 268, label: "Prostate", color: "#10b981" // Emerald
    },
    skin: {
      d: "M55,120 Q50,130 55,140 M145,120 Q150,130 145,140 M60,300 H70 M130,300 H140",
      cx: 160, cy: 100, label: "Skin", color: "#fb923c" // Orange
    }
  };

  // Wireframe Construction (Latitudinal Lines for 3D effect)
  const CONTOUR_LINES = [
    { y: 35, rx: 25, ry: 8 },  // Head Top
    { y: 55, rx: 28, ry: 9 },  // Head Mid
    { y: 80, rx: 20, ry: 6 },  // Neck
    { y: 110, rx: 55, ry: 15 }, // Shoulders
    { y: 140, rx: 50, ry: 18 }, // Chest
    { y: 180, rx: 45, ry: 14 }, // Waist
    { y: 220, rx: 50, ry: 16 }, // Hips
    { y: 280, rx: 25, ry: 10 }, // Thighs
    { y: 350, rx: 20, ry: 8 },  // Knees
    { y: 420, rx: 15, ry: 6 },  // Ankles
  ];

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden relative items-center justify-center p-0 bg-[radial-gradient(circle_at_center,_#1e1e24_0%,_#0a0a0b_100%)]">
        
      {/* 3D Grid Environment */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,240,255,0.03)_100%)] transform perspective-[1000px] rotate-x-60 scale-150">
             {/* Floor Grid */}
             <div className="w-full h-full bg-[size:40px_40px] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"></div>
          </div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        
        {/* Holographic Container */}
        <div className="relative w-[300px] h-[600px] animate-float">
            
            {/* Spinning Data Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-10">
                <div className="w-full h-full border border-primary/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-4 border border-dashed border-primary/30 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
            </div>

            <svg 
                viewBox="0 0 200 500" 
                className="w-full h-full drop-shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.05" />
                        <stop offset="20%" stopColor="#00f0ff" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.02" />
                        <stop offset="80%" stopColor="#00f0ff" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <radialGradient id="organGlow">
                        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>
                    {/* Pattern for scanlines on body */}
                    <pattern id="scanPattern" x="0" y="0" width="10" height="4" patternUnits="userSpaceOnUse">
                         <line x1="0" y1="2" x2="10" y2="2" stroke="#00f0ff" strokeWidth="0.5" strokeOpacity="0.1" />
                    </pattern>
                </defs>

                {/* --- LAYER 1: BACK WIREFRAME (Depth) --- */}
                <g className="opacity-30">
                     {CONTOUR_LINES.map((line, i) => (
                         <ellipse 
                            key={`back-${i}`}
                            cx="100" 
                            cy={line.y} 
                            rx={line.rx} 
                            ry={line.ry} 
                            fill="none" 
                            stroke="#3f3f46" 
                            strokeWidth="1"
                            strokeDasharray="2 2"
                         />
                     ))}
                     {/* Spine */}
                     <path d="M100,35 V240" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 2" />
                </g>

                {/* --- LAYER 2: ORGANS (Internal) --- */}
                {Object.entries(ORGAN_PATHS).map(([key, data]) => {
                    const isHighlighted = highlightedOrgans.includes(key);
                    const opacity = highlightedOrgans.length === 0 ? 0.3 : (isHighlighted ? 0.9 : 0.1);
                    
                    return (
                        <g key={key} className="transition-all duration-700 ease-out">
                            <path
                                d={data.d}
                                fill={isHighlighted ? data.color : "#27272a"}
                                stroke={isHighlighted ? "#fff" : "#52525b"}
                                strokeWidth={isHighlighted ? 1.5 : 0.5}
                                fillOpacity={isHighlighted ? 0.6 : 0.2}
                                filter={isHighlighted ? "url(#glow)" : ""}
                                style={{ transformOrigin: 'center' }}
                                className={isHighlighted ? "animate-pulse" : ""}
                            />
                            {/* Inner volumetric highlight */}
                            {isHighlighted && (
                                 <path
                                    d={data.d}
                                    fill="url(#organGlow)"
                                    fillOpacity="0.2"
                                    stroke="none"
                                    transform="scale(0.8)"
                                 />
                            )}
                        </g>
                    )
                })}

                {/* --- LAYER 3: BODY SHELL (Front) --- */}
                <g>
                    {/* Main Silhouette */}
                    <path 
                        d="M100,30 Q125,30 128,55 Q128,70 115,80 Q145,90 155,110 L160,180 Q160,190 150,220 L150,280 Q150,320 135,350 L135,450 H115 L115,360 Q115,350 100,350 Q85,350 85,360 L85,450 H65 L65,350 Q50,320 50,280 L50,220 Q40,190 40,180 L45,110 Q55,90 85,80 Q72,70 72,55 Q75,30 100,30 Z"
                        fill="url(#scanPattern)"
                        stroke="#00f0ff"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        filter="url(#glow)"
                    />
                    
                     {/* Front Contour Lines (Curvature) */}
                     {CONTOUR_LINES.map((line, i) => (
                         <path 
                            key={`front-${i}`}
                            d={`M ${100 - line.rx} ${line.y} A ${line.rx} ${line.ry} 0 0 0 ${100 + line.rx} ${line.y}`}
                            fill="none" 
                            stroke="#00f0ff" 
                            strokeWidth="0.5" 
                            strokeOpacity="0.2"
                         />
                     ))}
                     
                     {/* Center Line Tech Decoration */}
                     <line x1="100" y1="30" x2="100" y2="450" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="10 10" strokeOpacity="0.2" />
                </g>

                {/* --- LAYER 4: TARGETING UI (Overlay) --- */}
                {Object.entries(ORGAN_PATHS).map(([key, data]) => {
                     const isHighlighted = highlightedOrgans.includes(key);
                     if (!isHighlighted) return null;

                     const isLeft = data.cx < 100;
                     const labelX = isLeft ? -40 : 240;
                     const labelY = data.cy;
                     
                     return (
                         <g key={`ui-${key}`}>
                             {/* Connector Line */}
                             <polyline 
                                points={`${data.cx},${data.cy} ${isLeft ? data.cx - 20 : data.cx + 20},${data.cy} ${isLeft ? labelX + 60 : labelX - 60},${labelY} ${labelX},${labelY}`}
                                fill="none"
                                stroke={data.color}
                                strokeWidth="1"
                                className="animate-[dash_1s_ease-out_forwards]"
                                strokeDasharray="200"
                                strokeDashoffset="200"
                             />
                             
                             {/* Target Reticle on Organ */}
                             <g transform={`translate(${data.cx}, ${data.cy})`}>
                                 <circle r="15" stroke={data.color} strokeWidth="1" fill="none" strokeDasharray="4 2" className="animate-[spin_4s_linear_infinite]" />
                                 <line x1="-20" y1="0" x2="20" y2="0" stroke={data.color} strokeWidth="0.5" strokeOpacity="0.5" />
                                 <line x1="0" y1="-20" x2="0" y2="20" stroke={data.color} strokeWidth="0.5" strokeOpacity="0.5" />
                             </g>

                             {/* Label Box */}
                             <g transform={`translate(${labelX}, ${labelY})`}>
                                 <rect 
                                     x={isLeft ? -100 : 0} 
                                     y="-14" 
                                     width="100" 
                                     height="28" 
                                     fill="rgba(0,0,0,0.8)" 
                                     stroke={data.color} 
                                     strokeWidth="1"
                                     rx="2"
                                 />
                                 <text 
                                     x={isLeft ? -50 : 50} 
                                     y="5" 
                                     textAnchor="middle" 
                                     fill="#fff" 
                                     fontSize="12" 
                                     fontWeight="bold"
                                     className="font-mono"
                                     style={{ textShadow: `0 0 10px ${data.color}` }}
                                 >
                                     {data.label.toUpperCase()}
                                 </text>
                                 {/* Risk Alert Tag */}
                                 <rect 
                                     x={isLeft ? -50 : 50} 
                                     y="18" 
                                     width="12" 
                                     height="2" 
                                     fill={data.color}
                                     className="animate-pulse" 
                                 />
                             </g>
                         </g>
                     )
                })}

                {/* Active Scan Laser */}
                <g className="animate-[scan_4s_ease-in-out_infinite]">
                    <line x1="0" y1="0" x2="200" y2="0" stroke="#00f0ff" strokeWidth="2" strokeOpacity="0.8" filter="url(#glow)" />
                    <polygon points="0,0 200,0 200,30 0,30" fill="url(#bodyGradient)" opacity="0.3" />
                </g>
            </svg>
        </div>
        
        {/* Status Footer */}
        <div className="absolute bottom-8 text-center w-full max-w-sm">
            {highlightedOrgans.length > 0 ? (
                <div className="bg-surfaceHighlight/90 backdrop-blur border border-accent/50 p-4 rounded-xl shadow-[0_0_30px_rgba(255,0,85,0.1)] animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                        </span>
                        <p className="text-accent text-sm font-bold tracking-wider">PHENOTYPE MATCH</p>
                    </div>
                    <p className="text-xs text-muted font-mono">
                        Genetic variants identified with potential impact on {highlightedOrgans.join(", ")}.
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-[10px] text-primary/60 font-mono animate-pulse mb-2">
                        -- WAITING FOR SELECTION --
                    </p>
                    <div className="flex justify-center gap-1">
                        <span className="w-1 h-1 bg-primary/40 rounded-full"></span>
                        <span className="w-1 h-1 bg-primary/40 rounded-full"></span>
                        <span className="w-1 h-1 bg-primary/40 rounded-full"></span>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(500px); opacity: 0; }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes dash {
            to { stroke-dashoffset: 0; }
        }
        .animate-float {
            animation: float 8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};