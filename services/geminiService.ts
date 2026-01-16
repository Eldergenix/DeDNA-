import { GoogleGenAI, SchemaType, Type } from "@google/genai";
import { Variant, GenomicRegion } from "../types";

// Models defined per prompt requirements
const THINKING_MODEL = "gemini-3-pro-preview"; // For complex reasoning
const SEARCH_MODEL = "gemini-3-flash-preview"; // For up-to-date info

// --- CHAT COPILOT (Deep Reasoning or Search) ---
export const generateGenomicInsight = async (
  query: string,
  visibleVariants: Variant[],
  currentRegion: GenomicRegion,
  history: { role: string; content: string }[]
) => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return {
        text: "I'm running in demo mode. Please set your API_KEY to enable live AI analysis.",
        suggestedAction: null
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Heuristic: Does the user need external info? 
  // If yes, use Flash + Search. If no (analyzing user data), use Pro + Thinking.
  const needsSearch = /latest|news|research|search|google|recent|literature|treatment|drug|clinical trial/i.test(query);

  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }],
  }));

  try {
    if (needsSearch) {
        // --- MODE 1: SEARCH GROUNDING ---
        const systemInstruction = `
            You are DeDNA, a specialized Genome Copilot.
            You have access to Google Search to find real-time, up-to-date information.
            
            RULES:
            1. Search for the user's query to find the latest scientific consensus.
            2. If finding specific papers, cite them.
            3. Always extract relevant genes/phenotypes found in the search results.
            4. If the user asks about a phenotype (e.g., "features of Marfan syndrome"), map it to associated genes.
            5. Keep responses concise and scientific.
        `;

        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }], 
            },
            contents: [
                ...chatHistory,
                { role: "user", parts: [{ text: query }] }
            ]
        });

        return {
            text: response.text || "No results found.",
            navigationTarget: null,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };

    } else {
        // --- MODE 2: DEEP THINKING (Internal Data) ---
        const systemInstruction = `
            You are DeDNA, a specialized Genome Copilot using deep reasoning.
            Your goal is to analyze the user's uploaded genetic data with clinical precision.
            
            CONTEXT:
            Current Region: ${currentRegion.chromosome}:${currentRegion.start}-${currentRegion.end}
            User Variants: ${JSON.stringify(visibleVariants.map(v => ({
                id: v.id, gene: v.gene, pos: v.position, 
                consequence: v.consequence, classification: v.classification,
                phenotypes: v.phenotypes
            })))}

            RULES:
            1. Use your thinking budget to deeply analyze variant pathogenicity and gene-phenotype correlations.
            2. Classify findings based on ACMG guidelines logic where applicable.
            3. If the user asks to "Go to" a gene/variant, return the 'navigationTarget' JSON.
            4. Consider the molecular impact (protein structure, folding) if relevant.
            5. NEVER provide medical diagnosis.
        `;

        const prompt = `
            User Query: ${query}
            
            Respond in JSON format:
            {
                "text": "Response string (markdown allowed)",
                "navigationTarget": {
                    "chromosome": "string",
                    "position": number,
                    "variantId": "string"
                } | null
            }
        `;

        const response = await ai.models.generateContent({
            model: THINKING_MODEL,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                // Enable Thinking for complex analysis (Max budget)
                thinkingConfig: { thinkingBudget: 32768 } 
            },
            contents: [
                ...chatHistory,
                { role: "user", parts: [{ text: prompt }] }
            ]
        });

        const responseText = response.text;
        if (!responseText) throw new Error("No response from AI");
        return JSON.parse(responseText);
    }

  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      text: "I encountered an error analyzing the genomic data. Please try again.",
      navigationTarget: null
    };
  }
};

// --- URL / TOPIC ANALYSIS (Landing Page) ---
// Uses Search to find info, then extracts entities.
export const analyzeWithSearch = async (query: string) => {
    if (!process.env.API_KEY) {
        // Fallback for demo
        return { 
            text: "Demo Mode: Simulated search results for " + query, 
            genes: ["BRCA1", "TP53"], 
            phenotypes: ["Simulated Trait"],
            sources: []
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Step 1: Perform Search with broadened scope for Phenotypes/Traits
        const searchResponse = await ai.models.generateContent({
            model: SEARCH_MODEL,
            config: {
                tools: [{ googleSearch: {} }],
            },
            contents: [{ role: "user", parts: [{ text: `
                Analyze the following input: "${query}".
                Context: Genomics, Rare Disease, and Oncology.
                Tasks:
                1. If it's a phenotype/symptom, find associated genes.
                2. If it's a URL/Paper, summarize findings.
                3. If it's a Gene, find associated diseases.
                Summarize key clinical associations.
            ` }] }]
        });

        const summaryText = searchResponse.text || "";
        const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Extract Sources
        const sources = chunks
            .map((c: any) => c.web?.uri ? { title: c.web.title, uri: c.web.uri } : null)
            .filter(Boolean);

        // Step 2: Extract Structured Data (Genes/Phenotypes) from the Summary
        const extractionResult = await extractEntitiesFromText(summaryText, 'genes');

        return {
            text: summaryText,
            genes: extractionResult.genes || [],
            phenotypes: extractionResult.phenotypes || [],
            sources: sources
        };

    } catch (error) {
        console.error("Search Analysis Error:", error);
        throw error;
    }
};

// --- ENTITY EXTRACTION (Text Processing) ---
export const extractEntitiesFromText = async (
    textContent: string,
    mode: 'genes' | 'phenotypes'
) => {
    if (!process.env.API_KEY) {
        if (textContent.includes("FAIL_TEST")) {
            return { genes: [], phenotypes: [], summary: "No entities found." };
        }
        return {
            genes: ['BRCA1', 'TP53', 'EGFR'],
            phenotypes: ['Breast Cancer'],
            summary: "Demo extraction."
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `
        You are an expert Genomic Curator. 
        Extract relevant genetic entities from the text.
        If NO relevant entities are found, return empty arrays.
    `;

    const prompt = `
        Text: ${textContent.substring(0, 20000)}
        
        Return JSON:
        {
            "genes": ["GENE1", "GENE2"],
            "phenotypes": ["Trait1"],
            "summary": "Brief summary"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Fast model for simple extraction
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const responseText = response.text;
        if (!responseText) throw new Error("No response");
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Extraction Error:", error);
        return { genes: [], phenotypes: [], summary: "Error extracting entities." };
    }
};