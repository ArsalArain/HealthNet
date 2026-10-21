// FIXED VERSION: New complete symptomAnalyzer.js with all fixes applied
// This file replaces the old symptomAnalyzer.js with improved logic

const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");
const symptomNLP = require('./symptomNLP');

/**
 * Load the diseases and symptoms dataset from CSV
 */
function loadDiseasesDataset() {
  try {
    // Use module-relative path so file resolves regardless of working directory
    let csvPath = path.join(
      __dirname,
      '..',
      'Final_Augmented_dataset_Diseases_and_Symptoms.csv'
    );

    // If the main CSV is very large, prefer a compact training CSV to avoid OOM
    try {
      const stats = fs.statSync(csvPath);
      const MAX_SAFE_BYTES = 20 * 1024 * 1024; // 20 MB
      if (stats.size > MAX_SAFE_BYTES) {
        const compactPath = path.join(__dirname, '..', '..', 'symptom_model_service', 'train_dataset_compact.csv');
        if (fs.existsSync(compactPath)) {
          console.warn('Large dataset detected — using compact dataset at', compactPath);
          csvPath = compactPath; // override to compact dataset
        } else {
          console.warn('Large dataset detected and no compact dataset available; parsing may use a lot of memory.');
        }
      }
    } catch (err) {
      // ignore stat errors and proceed
    }

    if (!fs.existsSync(csvPath)) {
      console.warn("Dataset not found at:", csvPath);
      return [];
    }

    const fileContent = fs.readFileSync(csvPath, "utf8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (!records.length) return [];

    const firstRecord = records[0];
    const diseaseKey = Object.keys(firstRecord).find(
      (key) => key.toLowerCase() === 'diseases' || key.toLowerCase() === 'disease'
    ) || 'Disease';

    // Try to find a text-based symptom column (Symptoms, SymptomsText, etc.)
    const symptomField = Object.keys(firstRecord).find((key) => {
      const lk = String(key || '').toLowerCase();
      return lk.includes('symptom') && key !== diseaseKey;
    });

    const symptomKeys = Object.keys(firstRecord).filter((key) => key !== diseaseKey);

    return records.map((record) => {
      const disease = record[diseaseKey] || record.Disease || record.disease || '';

      // If the CSV already contains a text Symptoms field (Symptoms, SymptomsText, etc.), keep it.
      const existingSymptoms = symptomField ? (record[symptomField] || '') : (record.Symptoms || record.symptoms || '');
      if (existingSymptoms && String(existingSymptoms).trim()) {
        return { Disease: disease, Symptoms: String(existingSymptoms) };
      }

      // Normalize one-hot rows into a space-separated symptom string.
      const activeSymptoms = symptomKeys
        .filter((key) => key !== diseaseKey)
        .filter((key) => {
          const value = record[key];
          return value === 1 || value === '1' || value === true || value === 'true';
        });

      return {
        Disease: disease,
        Symptoms: activeSymptoms.join(', '),
      };
    });
  } catch (error) {
    console.error("Error loading dataset:", error.message);
    return [];
  }
}

/**
 * Fix grammar and spelling in symptoms text
 * Uses basic NLP approach with common medical term mappings
 */
function fixGrammarAndSpelling(text) {
  if (!text || typeof text !== "string") return "";

  // Try to insert missing spaces for inputs like "ihavefever" -> "i have fever"
  function insertMissingSpaces(input) {
    if (!input || input.indexOf(" ") !== -1) return input;
    let s = String(input).toLowerCase();

    // Common quick fixes: ensure a space after a leading 'i' when concatenated (e.g. "ihave")
    s = s.replace(/^i(?=[a-z]{2,})/, 'i ');

    // Heuristic list of common tokens to separate when stuck together
    const tokens = [
      'have','feel','fever','headache','cough','sore','throat','vomit','nausea','pain','chills',
      'dizziness','cold','flu','temperature','breath','breathing','shortness','stomach','diarrhea',
      'rash','itch','nausea','vomiting'
    ];

    // Insert spaces around known tokens so that words break apart
    for (const tok of tokens) {
      s = s.replace(new RegExp(tok, 'g'), ' ' + tok + ' ');
    }

    // Collapse multiple spaces and trim
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }
  // Common medical term corrections and typo fixes
  const corrections = {
    hachde: "headache",
    head_ache: "headache",
    hadache: "headache",
    headeach: "headache",
    hear_pain: "hearing pain",
    ear_pain: "ear pain",
    ear_ache: "earache",
    fevr: "fever",
    fev: "fever",
    cough: "cough",
    cold: "cold",
    flu: "flu",
    sorethroat: "sore throat",
    sore_throat: "sore throat",
    sorethroat: "sore throat",
    nausea: "nausea",
    vomit: "vomiting",
    vomiting: "vomiting",
    diarrhea: "diarrhea",
    diarrea: "diarrhea",
    diareha: "diarrhea",
    stomache: "stomach pain",
    stomach_pain: "stomach pain",
    headace: "headache",
    migrain: "migraine",
    migrane: "migraine",
    anxiaty: "anxiety",
    deprssion: "depression",
    depression: "depression",
    high_blood_pressure: "high blood pressure",
    hipertension: "hypertension",
    hypretension: "hypertension",
    diabeties: "diabetes",
    diabete: "diabetes",
    asthma: "asthma",
    bronchitis: "bronchitis",
    pneumonia: "pneumonia",
    allergies: "allergies",
    allergiy: "allergy",
  };

  let corrected = insertMissingSpaces(text).toLowerCase().trim();

  // Replace common typos
  Object.entries(corrections).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, "gi");
    corrected = corrected.replace(regex, correct);
  });

  // Capitalize first letter
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);

  return corrected;
}

/**
 * Extract medical keywords from symptoms text (IMPROVED)
 */
function extractKeywords(text) {
  if (!text || typeof text !== "string") return [];

  // Medical-specific stop words (more conservative)
  const stopWords = new Set([
    "i", "have", "has", "and", "or", "the", "a", "an", "is", "are",
    "was", "were", "be", "been", "being", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can",
    "my", "me", "from", "to", "for", "in", "on", "at", "by", "with",
    "about", "of", "as", "during", "been", "it", "that", "this"
  ]);

  // Keywords that should ALWAYS be preserved (medical terms)
  const alwaysInclude = new Set([
    "fever", "pain", "ache", "cough", "cold", "flu", "headache",
    "nausea", "vomit", "diarrhea", "rash", "itching", "swelling",
    "weakness", "fatigue", "breathing", "breath", "chest", "heart",
    "stomach", "belly", "throat", "sore", "burn", "sting", "sharp",
    "dull", "severe", "mild", "moderate", "chronic", "acute", "ear", "uti"
  ]);

  const words = text
    .toLowerCase()
    .split(/[\s,\.\-;:!?]+/)
    .filter((word) => {
      if (!word) return false;
      // Include if it's in the always-include list OR
      // if it's > 2 chars AND not a stop word
      return alwaysInclude.has(word) || (word.length > 2 && !stopWords.has(word));
    });

  return [...new Set(words)]; // Remove duplicates
}

/**
 * Predict diseases based on symptoms using dataset
 */
function predictDisease(keywords, dataset) {
  if (!keywords || keywords.length === 0 || !dataset || dataset.length === 0) {
    return [];
  }

  const diseaseMatches = {};

  // Score each disease based on symptom matches
  dataset.forEach((record) => {
    const disease = record.Disease || record.disease || "";
    const symptoms = (record.Symptoms || record.symptoms || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!disease) return;

    let matchCount = 0;
    let matchQuality = 0;

    // Check how many keywords match the symptoms
    keywords.forEach((keyword) => {
      symptoms.forEach((symptom) => {
        // Exact match
        if (keyword.toLowerCase() === symptom.toLowerCase()) {
          matchCount += 2;
          matchQuality += 2;
        }
        // Partial match
        else if (
          symptom.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(symptom.toLowerCase())
        ) {
          matchCount += 1;
          matchQuality += 1;
        }
      });
    });

    if (matchCount > 0) {
      if (!diseaseMatches[disease]) {
        diseaseMatches[disease] = {
          disease,
          matchCount,
          matchQuality,
          symptoms,
          confidence: 0,
        };
      } else {
        diseaseMatches[disease].matchCount += matchCount;
        diseaseMatches[disease].matchQuality += matchQuality;
      }
    }
  });

  // Calculate confidence scores and sort (IMPROVED)
  const predictions = Object.values(diseaseMatches)
    .map((item) => {
      let confidence = 0;
      
      if (keywords && keywords.length > 0) {
        const matchRatio = item.matchQuality / (keywords.length * 2);
        confidence = Math.min(100, Math.round(matchRatio * 100));
        // Ensure minimum confidence of 20% if there's any match
        if (item.matchCount > 0 && confidence < 20) {
          confidence = 20 + Math.round((item.matchCount / keywords.length) * 30);
        }
      } else if (item.matchCount > 0) {
        // If we have matches but no keywords, still give confidence
        confidence = 35;
      }
      
      return {
        ...item,
        confidence: Math.max(0, Math.min(100, confidence))
      };
    })
    .sort((a, b) => b.confidence - a.confidence || b.matchCount - a.matchCount)
    .slice(0, 5); // Top 5 predictions

  return predictions;
}

/**
 * Analyze symptoms and predict diseases (ENHANCED with better error handling)
 */
async function analyzeSymptomsAndPredict(userInput) {
  try {
    const userInputTrimmed = (userInput || "").trim();
    
    if (!userInputTrimmed) {
      return {
        success: false,
        error: "Please provide symptoms text.",
        predictions: []
      };
    }

    // Step 1: Grammar and spelling fixes
    let correctedText = fixGrammarAndSpelling(userInputTrimmed);
    let keywords = extractKeywords(correctedText);
    
    // Step 2: Advanced NLP preprocessing
    try {
      const nlpResult = await symptomNLP.processSymptomText(userInputTrimmed);
      if (nlpResult && nlpResult.success && Array.isArray(nlpResult.symptoms)) {
        // Prefer NLP extracted symptoms
        if (nlpResult.symptoms.length > 0) {
          keywords = nlpResult.symptoms
            .map(s => s.symptom)
            .filter(s => s && s.length > 0);
          // Also use cleaned text from NLP
          if (nlpResult.cleaned) correctedText = nlpResult.cleaned;
        }
      }
    } catch (nlpError) {
      console.warn("NLP processing error (using fallback):", nlpError.message);
    }

    // Step 3: Load dataset
    const dataset = loadDiseasesDataset();
    if (!dataset || dataset.length === 0) {
      console.warn("Warning: Disease dataset is empty or failed to load");
      return {
        success: false,
        error: "Medical database unavailable. Please try again.",
        predictions: []
      };
    }

    // Step 4: Try Python ML Service (with better error handling)
    const PY_SERVICE_URL = process.env.SYMPTOM_MODEL_SERVICE_URL || "http://127.0.0.1:5001/predict";
    let predictions = [];
    let usedPythonService = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const resp = await fetch(PY_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: correctedText }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.predictions)) {
          predictions = data.predictions.map((p) => ({
            disease: p.disease,
            confidence: Math.min(100, Math.max(0, p.confidence))
          }));
          usedPythonService = true;
          console.log("✓ ML service predictions used");
        }
      }
    } catch (err) {
      console.warn(`ML Service unavailable (${PY_SERVICE_URL}):`, err.message);
    }

    // Step 5: Fallback to rule-based prediction if needed
    if (predictions.length === 0) {
      console.log("Using rule-based fallback prediction");
      predictions = predictDisease(keywords, dataset);
    }

    // Step 6: Return comprehensive result
    return {
      success: predictions.length > 0,
      original: userInputTrimmed,
      corrected: correctedText,
      keywords,
      predictions: predictions.slice(0, 5),
      message: predictions.length > 0 
        ? `Found ${predictions.length} possible disease(s) matching your symptoms.`
        : "No matching diseases found. Please provide more detailed symptoms.",
      usedPythonService,
      keywordCount: keywords.length
    };
  } catch (error) {
    console.error("Critical error in analyzeSymptomsAndPredict:", error);
    return {
      success: false,
      error: "An error occurred while analyzing symptoms. Please try again.",
      predictions: []
    };
  }
}

module.exports = {
  loadDiseasesDataset,
  fixGrammarAndSpelling,
  extractKeywords,
  predictDisease,
  analyzeSymptomsAndPredict,
};
