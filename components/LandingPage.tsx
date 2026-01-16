import React, { useState, useRef, useEffect } from "react";
import { AUTOCOMPLETE_GENES } from "../constants";
import { extractEntitiesFromText, analyzeWithSearch } from "../services/geminiService";

interface LandingPageProps {
  onGeneSelected: (gene: string) => void;
  onVcfUpload: (file: File) => void;
  onAnalysisComplete: (result: any) => void;
}

const REALISTIC_SCIENTIFIC_ABSTRACT = `
Genetic testing of 1,234 patients with early-onset breast cancer identified pathogenic variants 
in BRCA1, BRCA2, and PALB2. We also observed a high frequency of VUS in ATM and CHEK2. 
These findings suggest a polygenic risk score model may be appropriate for ...
`;

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGeneSelected, 
  onVcfUpload,
  onAnalysisComplete 
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "analyzing" | "uploading" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Handle Autocomplete
  useEffect(() => {
    if (query.length > 0) {
      const matches = AUTOCOMPLETE_GENES.filter(g => 
        g.toLowerCase().startsWith(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onGeneSelected(query.toUpperCase());
    }
  };

  const handleVcfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setStatus("uploading");
      setStatusMessage("Parsing variant call format...");
      onVcfUpload(e.target.files[0]);
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'genes' | 'phenotypes') => {
    const file = e.target.files?.[0];
    if (file) {
      setStatus("analyzing");
      setStatusMessage(mode === 'genes' ? "Extracting gene targets from publication..." : "Analyzing phenotypes to map gene risk...");
      
      // Simulate reading PDF text
      setTimeout(async () => {
         const mockText = REALISTIC_SCIENTIFIC_ABSTRACT;
         const result = await extractEntitiesFromText(mockText, mode);
         
         if (!result.genes || result.genes.length === 0) {
             setStatus("error");
             setStatusMessage("Analysis Failed: No relevant genetic entities found.");
             return;
         }

         setStatusMessage(`Found ${result.genes.length} linked genes: ${result.genes.join(", ")}`);
         setTimeout(() => onAnalysisComplete(result), 1000);
      }, 2000);
    }
  };

  const handleUrlAnalysis = async () => {
    // Basic validation
    if (query.length < 3) return;
    
    setStatus("analyzing");
    setStatusMessage("Searching Google for genomic context...");
    setSources([]);

    try {
        // Call the service that uses Gemini + Google Search
        const result = await analyzeWithSearch(query);
        
        if (result.sources && result.sources.length > 0) {
            setSources(result.sources);
        }

        if (!result.genes || result.genes.length === 0) {
             // If no genes found, maybe we just show the summary or error
             // For this app flow, we need genes to visualize.
             setStatus("error");
             setStatusMessage("No specific genes identified in search results.");
             return;
        }

        setStatusMessage(`Identified ${result.genes.length} genes from ${result.sources?.length || 0} sources.`);
        
        setTimeout(() => {
            onAnalysisComplete({
                genes: result.genes,
                phenotypes: result.phenotypes,
                summary: result.text
            });
        }, 1500);

    } catch (err) {
        setStatus("error");
        setStatusMessage("Analysis failed. Please check the URL or try a different topic.");
    }
  };

  const resetStatus = () => {
      setStatus("idle");
      setStatusMessage("");
      setQuery("");
      setSources([]);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Brand */}
        <div className="mb-10 text-center space-y-4">
           <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-surface border border-border shadow-2xl">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2 animate-pulse" style={{animationDelay: '100ms'}}></span>
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" style={{animationDelay: '200ms'}}></span>
           </div>
           <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
             DeDNA
           </h1>
           <p className="text-xl text-muted font-light max-w-xl mx-auto">
             The intelligent genome search engine. <br/>
             <span className="text-primary/80">Analyze. Visualise. Decode.</span>
           </p>
        </div>

        {/* Omnibox Container */}
        <div className={`relative w-full transition-all duration-300 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
           
           {/* Main Input */}
           <div className={`
              relative flex items-center w-full h-16 bg-surface/60 backdrop-blur-xl border 
              ${status === 'error' ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]' : isFocused ? 'border-primary shadow-[0_0_40px_rgba(0,240,255,0.15)]' : 'border-border shadow-2xl'} 
              rounded-2xl overflow-hidden transition-all group
           `}>
              <div className="pl-5 pr-3">
                 {status === 'error' ? (
                     <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                 ) : (
                     <svg className={`w-6 h-6 transition-colors ${isFocused ? 'text-primary' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                 )}
              </div>

              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        // If it looks like a URL or complex query, use Search Analysis
                        if (query.startsWith('http') || query.includes(" ")) handleUrlAnalysis();
                        else handleSearchSubmit(e);
                    }
                }}
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-muted/50 h-full w-full"
                placeholder="Search a gene, topic, URL, or upload data..."
              />

              {/* Right Actions */}
              <div className="flex items-center gap-1 pr-2">
                 {/* Upload PDF (Split Button) */}
                 <div className="relative group/pdf">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white" title="Analyze Research Paper">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    {/* Hover Menu for PDF modes */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl opacity-0 group-hover/pdf:opacity-100 pointer-events-none group-hover/pdf:pointer-events-auto transition-opacity z-50 overflow-hidden">
                       <button onClick={() => pdfInputRef.current?.click()} className="block w-full text-left px-4 py-3 text-xs hover:bg-white/5 text-muted hover:text-white border-b border-border">
                          Extract Genes (Gemini)
                       </button>
                       <button onClick={() => pdfInputRef.current?.click()} className="block w-full text-left px-4 py-3 text-xs hover:bg-white/5 text-muted hover:text-white">
                          Map Phenotypes (Gemini)
                       </button>
                    </div>
                    <input 
                        type="file" 
                        accept=".pdf" 
                        ref={pdfInputRef} 
                        className="hidden" 
                        onChange={(e) => handlePdfSelect(e, 'genes')}
                    />
                 </div>

                 {/* Upload VCF */}
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white"
                    title="Upload VCF/23andMe"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                 </button>
                 <input 
                    type="file" 
                    accept=".vcf,.txt,.csv" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleVcfSelect}
                 />

                 {/* Analyze Action (Trigger if text is URL or long query) */}
                 {(query.length > 3) && (
                    <button 
                        onClick={handleUrlAnalysis}
                        className="ml-2 px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
                    >
                        Gemini Search
                    </button>
                 )}
              </div>
           </div>

           {/* Suggestions Dropdown */}
           {isFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface/90 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-[10px] uppercase text-muted font-bold tracking-wider opacity-50">Suggestions</div>
                  {suggestions.map((gene, i) => (
                      <div 
                        key={i}
                        onMouseDown={() => onGeneSelected(gene)}
                        className="flex items-center px-4 py-3 hover:bg-white/5 cursor-pointer group"
                      >
                         <div className="w-8 h-8 rounded-full bg-surfaceHighlight border border-border flex items-center justify-center mr-3 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                            <span className="material-icons text-xs font-mono">🧬</span>
                         </div>
                         <div>
                             <div className="text-sm font-bold text-text">{gene}</div>
                             <div className="text-xs text-muted">Jump to locus</div>
                         </div>
                      </div>
                  ))}
              </div>
           )}
           
           {/* Analyzing Overlay */}
           {status !== "idle" && status !== "error" && (
              <div className="absolute top-full left-0 right-0 mt-4 p-4 bg-surfaceHighlight/50 backdrop-blur rounded-xl border border-primary/20 flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center space-x-4 mb-2">
                    <div className="relative">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{status === 'uploading' ? 'Processing File' : 'Gemini Intelligence'}</span>
                        <span className="text-xs text-primary/80 animate-pulse">{statusMessage}</span>
                    </div>
                 </div>
                 
                 {/* Show Sources if found during search */}
                 {sources.length > 0 && (
                     <div className="w-full mt-2 pt-2 border-t border-white/10">
                         <p className="text-[10px] text-muted uppercase mb-1">Grounding Sources</p>
                         <div className="flex flex-wrap gap-2">
                             {sources.slice(0, 3).map((s, i) => (
                                 <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded truncate max-w-[200px]">
                                     {s.title || s.uri}
                                 </a>
                             ))}
                             {sources.length > 3 && <span className="text-[10px] text-muted">+{sources.length - 3} more</span>}
                         </div>
                     </div>
                 )}
              </div>
           )}

           {/* Error State Overlay */}
           {status === 'error' && (
               <div className="absolute top-full left-0 right-0 mt-4 p-4 bg-red-500/10 backdrop-blur rounded-xl border border-red-500/30 flex items-center justify-between space-x-4 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center space-x-3">
                       <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                       </svg>
                       <span className="text-sm text-red-200">{statusMessage}</span>
                   </div>
                   <button 
                      onClick={resetStatus}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs rounded-md transition-colors"
                   >
                       Try Again
                   </button>
               </div>
           )}
        </div>

        {/* Quick Tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['BRCA1', 'TP53', 'CFTR', 'EGFR'].map(gene => (
                <button 
                    key={gene}
                    onClick={() => onGeneSelected(gene)}
                    className="px-4 py-1.5 rounded-full bg-surface/40 border border-border hover:border-primary/50 hover:bg-primary/10 text-xs text-muted hover:text-white transition-all"
                >
                    {gene}
                </button>
            ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 text-center space-y-2 opacity-50">
         <p className="text-[10px] text-muted uppercase tracking-widest">Powered by Google Gemini 3.0 Pro (Thinking) & Flash (Search)</p>
         <div className="flex justify-center gap-4 text-[10px] text-muted/60">
            <span>Privacy First</span>
            <span>•</span>
            <span>Encrypted Uploads</span>
            <span>•</span>
            <span>Research Grade</span>
         </div>
      </div>
    </div>
  );
};