import React, { useState, useEffect } from 'react';
import { GenomicRegion, Variant, GeneModel } from './types';
import { INITIAL_REGION, MOCK_VARIANTS, MOCK_GENES, generateSyntheticData } from './constants';
import { GenomeBrowser } from './components/GenomeBrowser';
import { ChatCopilot } from './components/ChatCopilot';
import { VariantPanel } from './components/VariantPanel';
import { BodyMap } from './components/BodyMap';
import { MolecularViewer } from './components/MolecularViewer';
import { Button } from './components/ui/Button';
import { LandingPage } from './components/LandingPage';

const App: React.FC = () => {
  const [currentRegion, setCurrentRegion] = useState<GenomicRegion>(INITIAL_REGION);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>(MOCK_VARIANTS);
  const [geneModels, setGeneModels] = useState<GeneModel[]>(MOCK_GENES);
  
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  
  // View State
  const [viewMode, setViewMode] = useState<'genome' | 'phenotype' | 'molecular'>('genome');

  // Determine active gene name based on current region intersection
  const activeGeneName = React.useMemo(() => {
    // If a variant is selected, prioritize its gene
    if (selectedVariantId) {
        const v = variants.find(v => v.id === selectedVariantId);
        if (v) return v.gene;
    }
    // Otherwise check region overlap
    const gene = geneModels.find(g => 
        g.chromosome === currentRegion.chromosome && 
        !(g.end < currentRegion.start || g.start > currentRegion.end)
    );
    return gene ? gene.name : "Unknown Region";
  }, [currentRegion, selectedVariantId, variants, geneModels]);

  // Handle direct file upload (VCF/23andMe)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = (e instanceof File) ? e : e.target.files?.[0];
    
    if (file) {
      setIsUploading(true);
      // Simulate processing time
      setTimeout(() => {
        setIsUploading(false);
        setHasUploaded(true);
      }, 2000);
    }
  };

  const handleNavigate = (region: Partial<GenomicRegion>) => {
    setCurrentRegion(prev => ({ ...prev, ...region }));
    setViewMode('genome'); // Switch back to genome view on navigation
  };

  const handleVariantSelect = (id: string | null) => {
    setSelectedVariantId(id);
    if (id) {
      const variant = variants.find(v => v.id === id);
      if (variant) {
        // Center on variant with some padding
        setCurrentRegion({
          chromosome: variant.chromosome,
          start: variant.position - 5000,
          end: variant.position + 5000
        });
      }
    }
  };

  const handleGeneSearch = (query: string) => {
    const upperQuery = query.toUpperCase();
    
    // Check if we have a known gene model (or in our current dynamic set)
    let foundGene = geneModels.find(g => g.name === upperQuery);
    
    // If we are searching for a new gene not in mock/current set, we should arguably generate it 
    // But for this flow, we usually just search existing. 
    // Let's generate it just in case if the user searches via omnibox without analysis
    if (!foundGene) {
       const synthetic = generateSyntheticData([upperQuery]);
       setVariants(prev => [...prev, ...synthetic.variants]);
       setGeneModels(prev => [...prev, ...synthetic.genes]);
       foundGene = synthetic.genes[0];
    }
    
    if (foundGene) {
      setCurrentRegion({
        chromosome: foundGene.chromosome,
        start: foundGene.start,
        end: foundGene.end
      });
      setSelectedVariantId(null);
      if (!hasUploaded) setHasUploaded(true);
    }
  };

  // Called when AI analysis (PDF/URL) is done
  const handleAnalysisComplete = (result: { genes?: string[], phenotypes?: string[], summary?: string }) => {
      console.log("Analysis Result:", result);
      
      // If the analysis found specific genes, generate data for them and navigate
      if (result.genes && result.genes.length > 0) {
          // GENERATE SYNTHETIC DATA based on AI Findings
          // This replaces the "test" variants with "findings" variants
          const findings = generateSyntheticData(result.genes);
          
          setVariants(findings.variants);
          setGeneModels(findings.genes);
          
          // Navigate to the first found gene
          const firstGene = findings.genes[0];
          if (firstGene) {
              setCurrentRegion({
                  chromosome: firstGene.chromosome,
                  start: firstGene.start,
                  end: firstGene.end
              });
              // Optionally select the first variant if it exists (for immediate impact)
              if (findings.variants.length > 0) {
                 setSelectedVariantId(findings.variants[0].id);
              } else {
                 setSelectedVariantId(null);
              }
          }
      }

      setHasUploaded(true);
  };

  const getSelectedVariant = () => variants.find(v => v.id === selectedVariantId);

  // --- RENDER LANDING PAGE IF NOT ACTIVE ---
  if (!hasUploaded) {
      return (
          <LandingPage 
             onGeneSelected={handleGeneSearch}
             onVcfUpload={handleFileUpload}
             onAnalysisComplete={handleAnalysisComplete}
          />
      );
  }

  // --- MAIN APP WORKSPACE ---
  return (
    <div className="h-screen flex flex-col bg-background text-text overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-surface flex items-center px-4 justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <span className="text-background font-bold text-xs">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight">DeDNA</span>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-surfaceHighlight rounded-md p-1 border border-border">
            <button 
                onClick={() => setViewMode('genome')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'genome' ? 'bg-primary text-background' : 'text-muted hover:text-text'}`}
            >
                Genome
            </button>
            <button 
                onClick={() => setViewMode('molecular')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${viewMode === 'molecular' ? 'bg-purple-500 text-white' : 'text-muted hover:text-text'}`}
            >
                <span>Structure</span>
                <span className="text-[9px] bg-white/20 px-1 rounded-sm">Molecule</span>
            </button>
            <button 
                onClick={() => setViewMode('phenotype')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${viewMode === 'phenotype' ? 'bg-secondary text-white' : 'text-muted hover:text-text'}`}
            >
                <span>Body Map</span>
            </button>
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 bg-surfaceHighlight px-3 py-1 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-medium">Analysis Complete</span>
           </div>
           <Button variant="ghost" size="sm" onClick={() => setHasUploaded(false)}>New Search</Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Copilot */}
        <div className="w-1/3 min-w-[350px] max-w-[450px] z-10 shadow-xl border-r border-border">
          <ChatCopilot 
            currentRegion={currentRegion} 
            visibleVariants={variants} // In real app, filter by viewport or relevance
            onNavigate={handleNavigate}
            onSelectVariant={handleVariantSelect}
          />
        </div>

        {/* Center: Visualization Area */}
        <div className="flex-1 flex flex-col relative bg-black transition-all">
          {viewMode === 'genome' && (
              <GenomeBrowser 
                region={currentRegion}
                variants={variants}
                genes={geneModels}
                onRegionChange={(reg) => setCurrentRegion(reg)}
                onSelectVariant={handleVariantSelect}
                selectedVariantId={selectedVariantId}
              />
          )}
          
          {viewMode === 'molecular' && (
              <MolecularViewer 
                selectedVariant={getSelectedVariant()} 
                geneName={activeGeneName}
                onGeneSearch={handleGeneSearch}
                onFileUpload={handleFileUpload}
              />
          )}

          {viewMode === 'phenotype' && (
              <BodyMap highlightedOrgans={getSelectedVariant()?.affectedOrgans} />
          )}
          
          {/* Bottom Info Bar Overlay (Genome Mode Only) */}
          {viewMode === 'genome' && (
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="bg-surface/80 backdrop-blur-md border border-border rounded-lg p-3 inline-flex items-center space-x-4 pointer-events-auto shadow-lg">
                    <div className="text-xs">
                    <span className="text-muted block">View Window</span>
                    <span className="font-mono">{((currentRegion.end - currentRegion.start)/1000).toFixed(2)} kb</span>
                    </div>
                    <div className="h-6 w-px bg-border"></div>
                    <div className="text-xs">
                    <span className="text-muted block">Active Gene</span>
                    <span className="font-bold text-primary">{activeGeneName}</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Right: Variant Panel */}
        <VariantPanel 
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelectVariant={handleVariantSelect}
          onToggleBodyMap={() => setViewMode('phenotype')}
        />
      </div>
    </div>
  );
};

export default App;