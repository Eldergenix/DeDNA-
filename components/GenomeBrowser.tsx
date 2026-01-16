import React, { useMemo, useRef, useEffect } from "react";
import { GenomicRegion, Variant, GeneModel } from "../types";

interface GenomeBrowserProps {
  region: GenomicRegion;
  variants: Variant[];
  genes: GeneModel[];
  onRegionChange: (region: GenomicRegion) => void;
  onSelectVariant: (variantId: string) => void;
  selectedVariantId: string | null;
}

export const GenomeBrowser: React.FC<GenomeBrowserProps> = ({
  region,
  variants,
  genes,
  onRegionChange,
  onSelectVariant,
  selectedVariantId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Simple linear scale function
  const xScale = (pos: number) => {
    const domain = region.end - region.start;
    const range = width;
    return ((pos - region.start) / domain) * range;
  };

  // Filter genes based on props (dynamic data)
  const visibleGenes = useMemo(() => {
    return genes.filter(
      (g) => g.chromosome === region.chromosome && g.end >= region.start && g.start <= region.end
    );
  }, [region, genes]);

  const visibleVariants = useMemo(() => {
    return variants.filter(
      (v) => v.chromosome === region.chromosome && v.position >= region.start && v.position <= region.end
    );
  }, [region, variants]);

  // Calculate Variant Density Heatmap
  const densityData = useMemo(() => {
    if (width === 0) return [];
    // Use 4px bins for heatmap resolution
    const binWidth = 4;
    const numBins = Math.ceil(width / binWidth);
    if (numBins <= 0) return [];

    const bins = new Uint16Array(numBins);
    const domain = region.end - region.start;

    // Use visibleVariants to calculate density in current view
    visibleVariants.forEach(v => {
      const posOffset = v.position - region.start;
      const px = (posOffset / domain) * width;
      const binIdx = Math.floor(px / binWidth);
      if (binIdx >= 0 && binIdx < numBins) {
        bins[binIdx]++;
      }
    });

    const maxCount = Math.max(...Array.from(bins), 1);

    const data = [];
    for (let i = 0; i < numBins; i++) {
        if (bins[i] > 0) {
            const ratio = bins[i] / maxCount;
            
            // Heatmap Color Scale:
            // Low Density -> Cyan (#00f0ff)
            // Mid Density -> Purple (#7000ff)
            // High Density -> Red/Pink (#ff0055)
            let color = "#00f0ff";
            if (ratio >= 0.75) color = "#ff0055";
            else if (ratio >= 0.4) color = "#7000ff";

            data.push({
                x: i * binWidth,
                width: binWidth,
                // Scale opacity but keep it subtle as a background
                opacity: 0.3 + (ratio * 0.4),
                color: color,
                count: bins[i]
            });
        }
    }
    return data;
  }, [width, region, visibleVariants]);

  // Sort variants so the selected one is rendered last (on top)
  const sortedVariants = useMemo(() => {
    return [...visibleVariants].sort((a, b) => {
      if (a.id === selectedVariantId) return 1;
      if (b.id === selectedVariantId) return -1;
      return 0;
    });
  }, [visibleVariants, selectedVariantId]);

  const handleZoom = (factor: number) => {
    const range = region.end - region.start;
    const newRange = range * factor;
    const center = region.start + range / 2;
    onRegionChange({
      ...region,
      start: Math.round(center - newRange / 2),
      end: Math.round(center + newRange / 2),
    });
  };

  const handlePan = (direction: -1 | 1) => {
    const range = region.end - region.start;
    const shift = range * 0.2 * direction;
    onRegionChange({
      ...region,
      start: Math.round(region.start + shift),
      end: Math.round(region.end + shift),
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden relative">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-surfaceHighlight/50 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-primary font-bold">Chr{region.chromosome}</span>
          <span className="text-muted">
            {region.start.toLocaleString()} - {region.end.toLocaleString()}
          </span>
          <span className="text-muted text-[10px] ml-2">
            ({((region.end - region.start) / 1000).toFixed(1)}kb)
          </span>
        </div>
        <div className="flex items-center space-x-1">
           <button onClick={() => handlePan(-1)} className="p-1 hover:bg-white/10 rounded text-text">←</button>
           <button onClick={() => handlePan(1)} className="p-1 hover:bg-white/10 rounded text-text">→</button>
           <div className="w-px h-4 bg-border mx-1" />
           <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-white/10 rounded text-text">-</button>
           <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-white/10 rounded text-text">+</button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {width > 0 && (
          <svg width={width} height="100%" className="absolute inset-0">
            {/* Grid/Tick Lines */}
            {Array.from({ length: 10 }).map((_, i) => {
              const x = (i / 10) * width;
              return (
                <g key={i}>
                  <line x1={x} y1={0} x2={x} y2="100%" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={x + 4} y={12} fill="#52525b" fontSize="10" fontFamily="monospace">
                    {Math.round(region.start + (i / 10) * (region.end - region.start)).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Gene Track */}
            <g transform="translate(0, 60)">
               <text x={10} y={-10} fill="#a1a1aa" fontSize="10">Genes (RefSeq)</text>
               <line x1={0} y1={0} x2={width} y2={0} stroke="#3f3f46" strokeWidth="1" />
               {visibleGenes.map((gene) => {
                 const xStart = Math.max(0, xScale(gene.start));
                 const xEnd = Math.min(width, xScale(gene.end));
                 const w = Math.max(1, xEnd - xStart);
                 return (
                   <g key={gene.name} onClick={() => console.log('Gene click', gene.name)}>
                     <rect x={xStart} y={-4} width={w} height={8} fill="#3b82f6" opacity={0.5} rx={2} />
                     <text x={xStart + w / 2} y={-10} textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="bold">
                       {gene.name} {gene.strand === '+' ? '→' : '←'}
                     </text>
                     {/* Exons */}
                     {gene.exons.map((exon, idx) => {
                       const exStart = xScale(exon.start);
                       const exW = Math.max(1, xScale(exon.end) - exStart);
                       if (exStart + exW < 0 || exStart > width) return null;
                       return <rect key={idx} x={exStart} y={-6} width={exW} height={12} fill="#3b82f6" />;
                     })}
                   </g>
                 );
               })}
            </g>

            {/* Variant Track with Density Overlay */}
            <g transform="translate(0, 150)">
              <text x={10} y={-30} fill="#a1a1aa" fontSize="10">Variants (Analysis Findings)</text>
              
              {/* Density Heatmap Background */}
              <g style={{ filter: 'blur(3px)' }}>
                {densityData.map((d, i) => (
                  <rect 
                    key={i}
                    x={d.x}
                    y={-25} 
                    width={d.width}
                    height={50}
                    fill={d.color}
                    fillOpacity={d.opacity * 0.5} // Subtle background glow
                    shapeRendering="crispEdges"
                  />
                ))}
              </g>

              {/* Main Axis Line */}
              <line x1={0} y1={0} x2={width} y2={0} stroke="#3f3f46" strokeWidth="1" />

              {/* Individual Variants */}
              {sortedVariants.map((variant) => {
                const x = xScale(variant.position);
                const isSelected = selectedVariantId === variant.id;
                
                let color = "#9ca3af"; // Default gray
                if (variant.classification === "Pathogenic") color = "#ef4444"; // Red
                if (variant.classification === "Likely Pathogenic") color = "#f97316"; // Orange
                if (variant.classification === "VUS") color = "#eab308"; // Yellow
                if (variant.classification === "Benign") color = "#22c55e"; // Green

                return (
                  <g 
                    key={variant.id} 
                    transform={`translate(${x}, 0)`} 
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectVariant(variant.id)}
                  >
                    {isSelected && (
                      <g>
                        {/* Ping animation ring */}
                        <circle 
                            cx={0} 
                            cy={0} 
                            r={15} 
                            fill={color} 
                            opacity={0.3}
                            className="animate-ping"
                            style={{ animationDuration: '1.5s' }}
                        />
                        {/* Static glow for depth */}
                        <circle 
                            cx={0} 
                            cy={0} 
                            r={12} 
                            fill={color} 
                            opacity={0.15}
                        />
                        <line x1={0} y1={-150} x2={0} y2={150} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
                      </g>
                    )}
                    <circle 
                      cx={0} 
                      cy={0} 
                      r={isSelected ? 8 : 5} 
                      fill={color} 
                      stroke={isSelected ? "#fff" : "none"}
                      strokeWidth={2}
                      className="transition-all"
                    />
                    {/* Tooltip-like label for selected or hovered */}
                    <text 
                      y={20} 
                      textAnchor="middle" 
                      fill={isSelected ? "#ededed" : "#a1a1aa"} 
                      fontSize="10"
                      className="pointer-events-none"
                    >
                      {variant.ref}→{variant.alt}
                    </text>
                  </g>
                );
              })}
            </g>

          </svg>
        )}
      </div>
    </div>
  );
};