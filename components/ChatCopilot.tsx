import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, GenomicRegion, Variant } from "../types";
import { Button } from "./ui/Button";
import { generateGenomicInsight } from "../services/geminiService";

interface ChatCopilotProps {
  currentRegion: GenomicRegion;
  visibleVariants: Variant[];
  onNavigate: (region: Partial<GenomicRegion>) => void;
  onSelectVariant: (id: string) => void;
}

export const ChatCopilot: React.FC<ChatCopilotProps> = ({
  currentRegion,
  visibleVariants,
  onNavigate,
  onSelectVariant
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "system",
      content: "Hello! I'm your Genome Copilot. I've analyzed your VCF file. I see some variants in BRCA1 and BRCA2. Ask me about your cancer risk or specific variants.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Call Gemini Service
    const response = await generateGenomicInsight(
      userMsg.content,
      visibleVariants,
      currentRegion,
      messages.map(m => ({ role: m.role, content: m.content }))
    );

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "model",
      content: response.text,
      timestamp: Date.now(),
      relatedVariantId: response.navigationTarget?.variantId
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);

    // Auto-navigate if AI suggests it
    if (response.navigationTarget) {
      if (response.navigationTarget.chromosome && response.navigationTarget.position) {
         // Create a window around the target
         const pos = response.navigationTarget.position;
         onNavigate({
           chromosome: response.navigationTarget.chromosome,
           start: pos - 1000,
           end: pos + 1000
         });
      }
      if (response.navigationTarget.variantId) {
        onSelectVariant(response.navigationTarget.variantId);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm">
        <h2 className="font-semibold text-primary flex items-center">
          <span className="material-icons mr-2 text-lg"></span> 
          Genome Copilot
        </h2>
        <p className="text-xs text-muted mt-1">Powered by Gemini 3.0 Pro</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary/20 text-primary-50 border border-primary/30 rounded-tr-none' 
                : 'bg-surfaceHighlight border border-border rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Action Chip if variant referenced */}
              {msg.relatedVariantId && (
                <button 
                  onClick={() => onSelectVariant(msg.relatedVariantId!)}
                  className="mt-3 flex items-center text-xs bg-secondary/20 hover:bg-secondary/30 text-secondary-50 border border-secondary/40 px-3 py-1.5 rounded transition-colors"
                >
                  <span className="mr-2">⚡</span>
                  View Variant in Browser
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surfaceHighlight border border-border rounded-lg p-3 rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-surfaceHighlight/10">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about gene risk, variants, or navigate..."
            className="w-full bg-black/20 text-text rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary p-3 pr-10 resize-none h-20 text-sm scrollbar-hide focus:outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-3 right-3 p-1.5 bg-primary text-background rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted text-center mt-2">
          DeDNA results are informational only. Not for medical diagnosis.
        </p>
      </div>
    </div>
  );
};
