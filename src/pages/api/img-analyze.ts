// export const prerender = false;
// import { ImageAnnotatorClient } from "@google-cloud/vision";
// import type { APIRoute } from "astro";

// const credentials = JSON.parse(import.meta.env.GOOGLE_CLOUD_STORAGE_KEY_FILE);

// export const POST: APIRoute = async ({ request }) => {
//   try {
//     const { imageUrl } = await request.json();
//     if (!imageUrl) {
//       return new Response("Image URL is required", { status: 400 });
//     }

//     const visionClient = new ImageAnnotatorClient({
//       credentials: credentials,
//     });

//     // Request both text detection and object detection
//     const [result] = await visionClient.annotateImage({
//       image: { content: imageUrl.split(",")[1] }, // Remove data:image/jpeg;base64, prefix
//       features: [
//         { type: "TEXT_DETECTION" },
//         { type: "OBJECT_LOCALIZATION" },
//         { type: "LOGO_DETECTION" },
//         { type: "LABEL_DETECTION", maxResults: 5 },
//       ],
//     });

//     // Extract text and identify potential medicine names
//     const fullText = result.fullTextAnnotation?.text || "";
//     const textBlocks = result.textAnnotations?.slice(1) || [];

//     // Look for common medicine packaging terms
//     const medicineIndicators = [
//       "mg",
//       "tablet",
//       "capsule",
//       "tablets",
//       "capsules",
//       "prescription",
//       "drug",
//       "medicine",
//       "pharmaceutical",
//       "dose",
//       "dosage",
//       "active ingredient",
//     ];

//     // Find potential medicine names from text blocks
//     const potentialMedicineNames = textBlocks
//       .filter((block) => {
//         const text = block.description?.toLowerCase() || "";
//         // Filter out common non-medicine text
//         return (
//           !medicineIndicators.includes(text) &&
//           !/^\d+$/.test(text) && // Exclude pure numbers
//           text.length > 2
//         ); // Exclude very short text
//       })
//       .map((block) => block.description)
//       .slice(0, 3); // Get top 3 potential names

//     const response = {
//       medicineName: potentialMedicineNames[0] || "", // Best guess for medicine name
//       alternativeNames: potentialMedicineNames.slice(1), // Other potential names
//       fullText: fullText,
//       objects: result.localizedObjectAnnotations?.map((obj) => obj.name) || [],
//       logos: result.logoAnnotations?.map((logo) => logo.description) || [],
//       labels: result.labelAnnotations?.map((label) => label.description) || [],
//     };

//     return new Response(JSON.stringify(response), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (error) {
//     return new Response(
//       JSON.stringify({
//         error: "Failed to analyze image",
//         details: error instanceof Error ? error.message : "Unknown error",
//       }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   }
// };
import { ImageAnnotatorClient } from "@google-cloud/vision";
import type { APIRoute } from "astro";

const credentials = JSON.parse(import.meta.env.GOOGLE_CLOUD_STORAGE_KEY_FILE);

// List of common medicine indicator terms
const MEDICINE_INDICATORS = [
  "mg", "tablet", "capsule", "tablets", "capsules", "prescription", 
  "drug", "medicine", "pharmaceutical", "dose", "dosage", 
  "active ingredient", "rx", "oral", "injection", "suspension",
  "antibiotic", "ointment", "cream", "lotion", "solution",
  "syrup", "extended release", "immediate release"
];

// List of common medication suffixes to help with identification
const MEDICATION_SUFFIXES = [
  "cin", "zole", "mycin", "vir", "azole", "olol", "pril", 
  "sartan", "statin", "prazole", "tide", "mab", "zumab", 
  "ximab", "tinib", "vastatin", "parin", "oxacin", "triptan"
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return new Response("Image URL is required", { status: 400 });
    }

    const visionClient = new ImageAnnotatorClient({
      credentials: credentials,
    });

    // Request multiple types of detection for comprehensive analysis
    const [result] = await visionClient.annotateImage({
      image: { content: imageUrl.split(",")[1] }, // Remove data:image/jpeg;base64, prefix
      features: [
        { type: "TEXT_DETECTION" },
        { type: "OBJECT_LOCALIZATION" },
        { type: "LOGO_DETECTION" },
        { type: "LABEL_DETECTION", maxResults: 10 },
        { type: "DOCUMENT_TEXT_DETECTION" }, // Better for text on packaging
      ],
    });

    // Extract text and identify potential medicine names
    const fullText = result.fullTextAnnotation?.text || "";
    const textBlocks = result.textAnnotations?.slice(1) || [];

    // Function to score potential medicine names
    const scoreMedicineName = (text: string): number => {
      let score = 0;
      const lowerText = text.toLowerCase();
      
      // Check for indicators nearby
      if (MEDICINE_INDICATORS.some(indicator => 
        fullText.toLowerCase().includes(`${lowerText} ${indicator}`) || 
        fullText.toLowerCase().includes(`${indicator} ${lowerText}`)
      )) {
        score += 5;
      }
      
      // Check for medication suffixes
      if (MEDICATION_SUFFIXES.some(suffix => lowerText.endsWith(suffix))) {
        score += 3;
      }
      
      // Check for capitalization pattern typical of brand names
      if (/^[A-Z][a-z]+$/.test(text)) {
        score += 2;
      }
      
      // Common medicine packaging terms often found near medicine names
      if (fullText.toLowerCase().includes(`${lowerText} tablets`) || 
          fullText.toLowerCase().includes(`${lowerText} capsules`) ||
          fullText.toLowerCase().includes(`${lowerText} mg`)) {
        score += 4;
      }
      
      // Prefer words that aren't extremely short or long
      if (text.length > 3 && text.length < 20) {
        score += 1;
      }
      
      // Avoid generic words
      const genericWords = ["the", "and", "for", "with", "from", "this", "that", "each", "take"];
      if (genericWords.includes(lowerText)) {
        score -= 10;
      }
      
      return score;
    };

    // Filter and score potential medicine names
    const potentialMedicineNames = textBlocks
      .filter((block) => {
        const text = block.description?.toLowerCase() || "";
        // Basic filtering
        return (
          text.length > 2 && // Not too short
          !/^\d+$/.test(text) && // Not just numbers
          !/^[0-9.]+\s*mg$/.test(text) // Not just dosage
        );
      })
      .map((block) => ({
        name: block.description || "",
        score: scoreMedicineName(block.description || "")
      }))
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .filter(item => item.score > 0) // Only include items with positive scores
      .map(item => item.name);

    // Get pharmacy/drugstore logos if present
    const pharmacyLogos = result.logoAnnotations
      ?.filter(logo => {
        const name = logo.description?.toLowerCase() || "";
        return name.includes("pharm") || 
               name.includes("drug") || 
               name.includes("rx") ||
               name.includes("health");
      })
      .map(logo => logo.description) || [];

    // Check if labels indicate this is medication
    const medicationLabels = result.labelAnnotations
      ?.filter(label => {
        const desc = label.description?.toLowerCase() || "";
        return desc.includes("pill") || 
               desc.includes("medicine") || 
               desc.includes("drug") ||
               desc.includes("capsule") ||
               desc.includes("tablet") ||
               desc.includes("medication") ||
               desc.includes("pharmacy");
      })
      .map(label => label.description) || [];

    const response = {
      medicineName: potentialMedicineNames[0] || "", // Best guess for medicine name
      alternativeNames: potentialMedicineNames.slice(1, 5), // Other potential names, limited to top 5
      fullText: fullText,
      objects: result.localizedObjectAnnotations?.map((obj) => obj.name) || [],
      logos: result.logoAnnotations?.map((logo) => logo.description) || [],
      labels: result.labelAnnotations?.map((label) => label.description) || [],
      isMedication: medicationLabels.length > 0 || pharmacyLogos.length > 0,
      confidence: potentialMedicineNames.length > 0 ? "high" : "low"
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};