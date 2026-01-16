export enum VariantClassification {
  BENIGN = "Benign",
  LIKELY_BENIGN = "Likely Benign",
  VUS = "VUS",
  LIKELY_PATHOGENIC = "Likely Pathogenic",
  PATHOGENIC = "Pathogenic"
}

export interface GenomicRegion {
  chromosome: string;
  start: number;
  end: number;
}

export interface Variant {
  id: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  gene: string;
  consequence: string; // e.g., "missense_variant"
  classification: VariantClassification;
  alleleFrequency?: number;
  caddScore?: number; // In silico prediction score
  depth?: number;
  flags?: ("rare_disease" | "hereditary_cancer" | "pharmacogenomics")[];
  phenotypes?: string[]; // e.g., ["Breast Cancer Susceptibility", "Ovarian Cancer Risk"]
  affectedOrgans?: ("brain" | "lungs" | "heart" | "breasts" | "pancreas" | "ovaries" | "colon" | "prostate" | "skin")[];
}

export interface GeneModel {
  name: string;
  chromosome: string;
  start: number;
  end: number;
  strand: "+" | "-";
  exons: { start: number; end: number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: number;
  relatedVariantId?: string; // If the AI references a specific variant
  isThinking?: boolean;
}

export interface AppState {
  currentRegion: GenomicRegion;
  selectedVariantId: string | null;
  variants: Variant[];
  isUploading: boolean;
  uploadProgress: number;
}