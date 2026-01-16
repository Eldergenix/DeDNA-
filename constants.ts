import { GeneModel, Variant, VariantClassification } from "./types";

export const INITIAL_REGION = {
  chromosome: "17",
  start: 43044295,
  end: 43125483, // BRCA1 region approx
};

export const AUTOCOMPLETE_GENES = [
  "BRCA1", "BRCA2", "TP53", "CFTR", "EGFR", "KRAS", "APOE", "MTHFR", "COMT", "VDR",
  "TNF", "IL6", "SOD2", "GSTP1", "NOS3", "ACE", "ACTN3", "FTO", "MC4R", "ADIPOQ",
  "LEP", "PPARG", "TCF7L2", "SLC2A2", "DRD2", "ANKK1", "BDNF", "COMT", "MAOA", "HTR2A",
  "ABCB1", "CYP1A2", "CYP2C19", "CYP2C9", "CYP2D6", "CYP3A4", "CYP3A5", "SLCO1B1", "VKORC1",
  "APC", "ATM", "BARD1", "BMPR1A", "BRIP1", "CDH1", "CDK4", "CDKN2A", "CHEK2", "EPCAM"
];

const STATIC_VARIANTS: Variant[] = [
  {
    id: "var_001",
    chromosome: "17",
    position: 43057010,
    ref: "G",
    alt: "A",
    gene: "BRCA1",
    consequence: "missense_variant",
    classification: VariantClassification.PATHOGENIC,
    alleleFrequency: 0.0001,
    flags: ["hereditary_cancer"],
    depth: 120,
    phenotypes: ["Breast Cancer Susceptibility", "Ovarian Cancer Risk"],
    affectedOrgans: ["breasts", "ovaries"]
  },
  {
    id: "var_002",
    chromosome: "17",
    position: 43063850,
    ref: "C",
    alt: "T",
    gene: "BRCA1",
    consequence: "synonymous_variant",
    classification: VariantClassification.BENIGN,
    alleleFrequency: 0.45,
    depth: 98,
    phenotypes: ["None"],
    affectedOrgans: []
  },
  {
    id: "var_003",
    chromosome: "17",
    position: 43070900,
    ref: "A",
    alt: "G",
    gene: "BRCA1",
    consequence: "intron_variant",
    classification: VariantClassification.VUS,
    alleleFrequency: 0.005,
    depth: 105,
    phenotypes: ["Uncertain Clinical Significance"],
    affectedOrgans: []
  },
  {
    id: "var_004",
    chromosome: "13",
    position: 32315474,
    ref: "AG",
    alt: "A",
    gene: "BRCA2",
    consequence: "frameshift_variant",
    classification: VariantClassification.LIKELY_PATHOGENIC,
    alleleFrequency: 0.00005,
    flags: ["hereditary_cancer", "rare_disease"],
    depth: 85,
    phenotypes: ["Breast Cancer Susceptibility", "Prostate Cancer Risk", "Pancreatic Cancer Risk"],
    affectedOrgans: ["breasts", "prostate", "pancreas"]
  },
  {
    id: "var_005",
    chromosome: "7",
    position: 117232323,
    ref: "G",
    alt: "A",
    gene: "CFTR",
    consequence: "missense_variant",
    classification: VariantClassification.VUS,
    flags: ["rare_disease"],
    depth: 200,
    phenotypes: ["Cystic Fibrosis related traits", "Lung function variability"],
    affectedOrgans: ["lungs", "pancreas"]
  }
];

export const MOCK_VARIANTS = STATIC_VARIANTS;

// Simplified Gene Model for BRCA1
const STATIC_GENES: GeneModel[] = [
  {
    name: "BRCA1",
    chromosome: "17",
    start: 43044295,
    end: 43125483,
    strand: "-",
    exons: [
      { start: 43044295, end: 43045800 },
      { start: 43047500, end: 43047700 },
      { start: 43049100, end: 43049250 },
      { start: 43051000, end: 43051200 },
      { start: 43057000, end: 43057150 }, // Contains var_001
      { start: 43063800, end: 43063950 }, // Contains var_002
      { start: 43070800, end: 43071000 },
      { start: 43074000, end: 43074200 },
      { start: 43124000, end: 43125483 },
    ]
  },
   {
    name: "BRCA2",
    chromosome: "13",
    start: 32315000,
    end: 32400000,
    strand: "+",
    exons: [
       { start: 32315400, end: 32315600 },
       { start: 32320000, end: 32320500 },
    ]
  }
];

export const MOCK_GENES = STATIC_GENES;

// --- DYNAMIC DATA GENERATOR ---
// This function creates plausible mock data for any gene found by the AI
export const generateSyntheticData = (targetGenes: string[]) => {
    const generatedVariants: Variant[] = [];
    const generatedGenes: GeneModel[] = [];

    // Helper to get random number in range
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

    targetGenes.forEach(geneName => {
        // 1. Check if we have static data for high fidelity
        const existingGene = STATIC_GENES.find(g => g.name === geneName);
        const existingVars = STATIC_VARIANTS.filter(v => v.gene === geneName);

        if (existingGene) {
            generatedGenes.push(existingGene);
            generatedVariants.push(...existingVars);
        } else {
            // 2. Generate Synthetic Data
            // Assign a stable random chromosome based on gene name char code sum
            const charSum = geneName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const chrom = ((charSum % 22) + 1).toString();
            
            // Random start position between 1M and 150M
            const start = randomInt(1000000, 150000000);
            const length = randomInt(5000, 50000);
            const end = start + length;

            // Create Gene Model
            generatedGenes.push({
                name: geneName,
                chromosome: chrom,
                start: start,
                end: end,
                strand: charSum % 2 === 0 ? '+' : '-',
                exons: [
                    { start: start, end: start + 200 },
                    { start: start + 1000, end: start + 1300 },
                    { start: end - 500, end: end }
                ]
            });

            // Create 1-3 Synthetic Variants
            const numVariants = randomInt(1, 3);
            for (let i = 0; i < numVariants; i++) {
                const varPos = randomInt(start, end);
                const isPathogenic = Math.random() > 0.7; // 30% chance of pathogenic for demo drama
                
                generatedVariants.push({
                    id: `syn_${geneName}_${i}`,
                    chromosome: chrom,
                    position: varPos,
                    ref: "G",
                    alt: Math.random() > 0.5 ? "A" : "T",
                    gene: geneName,
                    consequence: isPathogenic ? "missense_variant" : "synonymous_variant",
                    classification: isPathogenic ? VariantClassification.PATHOGENIC : VariantClassification.VUS,
                    alleleFrequency: isPathogenic ? 0.0001 : 0.05,
                    depth: randomInt(50, 200),
                    flags: isPathogenic ? ["rare_disease"] : [],
                    phenotypes: isPathogenic ? [`${geneName}-related disorder`] : ["Uncertain significance"],
                    affectedOrgans: isPathogenic ? ["brain", "heart"] : [] // Generic default
                });
            }
        }
    });

    return { variants: generatedVariants, genes: generatedGenes };
};