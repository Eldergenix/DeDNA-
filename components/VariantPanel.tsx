import React from "react";
import { Variant, VariantClassification } from "../types";
import { Button } from "./ui/Button";

interface VariantPanelProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelectVariant: (id: string | null) => void;
  onToggleBodyMap?: (show: boolean) => void; // New callback
}

export const VariantPanel: React.FC<VariantPanelProps> = ({
  variants,
  selectedVariantId,
  onSelectVariant,
  onToggleBodyMap
}) => {
  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  const getBadgeColor = (classification: VariantClassification) => {
    switch (classification) {
      case VariantClassification.PATHOGENIC: return "bg-red-500/20 text-red-400 border-red-500/30";
      case VariantClassification.LIKELY_PATHOGENIC: return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case VariantClassification.VUS: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case VariantClassification.BENIGN: return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-80">
      <div className="p-4 border-b border-border bg-surfaceHighlight/30">
        <h2 className="font-semibold text-text">Analysis Findings</h2>
        <div className="flex space-x-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
            {variants.filter(v => v.classification === VariantClassification.PATHOGENIC).length} Pathogenic
          </span>
           <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            {variants.filter(v => v.classification === VariantClassification.VUS).length} VUS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedVariant ? (
          <div className="p-4 space-y-4">
            <button 
              onClick={() => onSelectVariant(null)} 
              className="text-xs text-muted hover:text-text flex items-center mb-2"
            >
              ← Back to list
            </button>
            
            <div className="border border-border rounded-lg p-4 bg-surfaceHighlight/20">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-text">{selectedVariant.gene}</h3>
                <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold ${getBadgeColor(selectedVariant.classification)}`}>
                  {selectedVariant.classification}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div>
                     <span className="text-muted block">Position</span>
                     <span className="font-mono text-text">Chr{selectedVariant.chromosome}:{selectedVariant.position}</span>
                   </div>
                   <div>
                     <span className="text-muted block">Change</span>
                     <span className="font-mono text-text">{selectedVariant.ref} → {selectedVariant.alt}</span>
                   </div>
                </div>

                <div>
                   <span className="text-muted block text-xs">Consequence</span>
                   <span className="text-text capitalize">{selectedVariant.consequence.replace('_', ' ')}</span>
                </div>

                <div>
                   <span className="text-muted block text-xs">Frequency (gnomAD)</span>
                   <span className="text-text font-mono">{selectedVariant.alleleFrequency?.toExponential(2) || "N/A"}</span>
                </div>

                {selectedVariant.flags && selectedVariant.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedVariant.flags.map(flag => (
                      <span key={flag} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {flag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phenotype Section */}
            {selectedVariant.phenotypes && selectedVariant.phenotypes.length > 0 && (
                <div className="bg-surfaceHighlight/30 border border-border p-3 rounded-md">
                    <h4 className="text-xs font-bold text-text mb-2 flex items-center">
                        <span className="mr-2">🧬</span> Phenotypic Traits
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                        {selectedVariant.phenotypes.map((trait, idx) => (
                            <li key={idx} className="text-xs text-muted">{trait}</li>
                        ))}
                    </ul>
                    
                    {selectedVariant.affectedOrgans && selectedVariant.affectedOrgans.length > 0 && (
                        <div className="mt-3">
                             <Button 
                                variant="secondary" 
                                size="sm" 
                                className="w-full flex items-center justify-center gap-2"
                                onClick={() => onToggleBodyMap && onToggleBodyMap(true)}
                             >
                                <span>View Body Map</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="5" r="3"></circle>
                                    <path d="M12 8v16M8 11h8"></path>
                                </svg>
                             </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-md">
              <h4 className="text-xs font-bold text-blue-400 mb-1">AI Interpretation</h4>
              <p className="text-xs text-blue-200/80 leading-relaxed">
                This variant is classified as {selectedVariant.classification}. 
                It is a {selectedVariant.consequence.replace('_', ' ')} in the {selectedVariant.gene} gene.
              </p>
            </div>

            <Button className="w-full" variant="outline" size="sm">
              View External Evidence (ClinVar)
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {variants.map(variant => (
              <div 
                key={variant.id}
                onClick={() => onSelectVariant(variant.id)}
                className="p-3 hover:bg-surfaceHighlight cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-text group-hover:text-primary transition-colors">
                    {variant.gene}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    variant.classification === VariantClassification.PATHOGENIC ? 'bg-red-500' :
                    variant.classification === VariantClassification.VUS ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                </div>
                <div className="text-xs text-muted font-mono mb-1">
                  {variant.ref}→{variant.alt} • {variant.consequence.split('_')[0]}
                </div>
                <div className="flex justify-between items-center">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getBadgeColor(variant.classification)}`}>
                      {variant.classification}
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};