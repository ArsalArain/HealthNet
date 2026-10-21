const fs = require('fs');
const path = require('path');

// Simple Levenshtein distance implementation
function levenshtein(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Load compact symptom vocabulary from the compact CSV if available
function loadSymptomVocabulary() {
  try {
    const compactPath = path.join(__dirname, '..', '..', 'symptom_model_service', 'train_dataset_compact.csv');
    if (!fs.existsSync(compactPath)) return new Set();
    const content = fs.readFileSync(compactPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return new Set();
    const header = lines[0].split(',');
    const symIndex = header.findIndex(h => /symptom/i.test(h));
    const set = new Set();
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (symIndex >= 0 && cols[symIndex]) {
        cols[symIndex].split(/;|,|\|/).forEach(s => {
          const t = String(s || '').trim().toLowerCase();
          if (t) set.add(t);
        });
      }
    }
    return set;
  } catch (err) {
    return new Set();
  }
}

const SYMPTOM_VOCAB = loadSymptomVocabulary();

const STOP_WORDS = new Set([
  'i','have','has','and','or','the','a','an','is','are','my','me','for','in','on','at','by','with','about','of','as'
]);

// Small mapping for Urdu words -> English common symptom tokens
const URDU_MAP = {
  'bukhar': 'fever',
  'bhukhar': 'fever',
  'bhokhar': 'fever',
  'khansi': 'cough',
  'khansy': 'cough',
  'sir': 'head',
  'sar': 'head',
  'dard': 'pain',
  'dardka': 'pain',
  'dard ka': 'pain',
  'saans': 'breathing',
  'saans ki': 'breathing',
  'takleef': 'pain',
  'mujhe': '',
  'muj': '',
  'moj': '',
  'mojh': '',
  'mujhy': '',
  'mujhay': '',
  'mujhe': '',
  'hai': '',
  'hy': '',
  'hae': '',
  'mera': '',
  'mere': '',
  'din': 'day',
  'dinon': 'days',
  '3din': '3 days',
};

function detectLanguage(text) {
  if (!text) return 'en';
  // If contains Arabic/Persian/Urdu characters
  if (/\p{Script=Arabic}/u.test(text)) return 'ur';
  // common Urdu/roman-Urdu words
  const lowered = text.toLowerCase();
  for (const k of Object.keys(URDU_MAP)) {
    if (lowered.includes(k)) return 'ur';
  }
  return 'en';
}

function insertMissingSpaces(input) {
  if (!input || typeof input !== 'string') return input;
  // If input already has spaces, skip
  if (input.indexOf(' ') !== -1) return input;
  let s = input.toLowerCase();
  // separate digits followed by letters: e.g., '3din' -> '3 din'
  s = s.replace(/(\d+)([a-z]+)/g, '$1 $2');

  // Ensure a space after leading 'i' when concatenated (e.g., 'ihave')
  s = s.replace(/^i(?=[a-z]{1,})/, 'i ');

  // Candidate tokens to split on (english + roman-urdu keys)
  const tokens = [
    'i','have','feel','fever','headache','cough','sore','throat','vomit','nausea','pain','chills',
    'dizziness','cold','flu','temperature','breath','breathing','shortness','stomach','diarrhea',
    'rash','itch','vomiting','and','or','for','day','days','din','khansi','bukhar','sar','dard','saans'
  ];
  // include URDU_MAP keys
  Object.keys(URDU_MAP).forEach(k => { if (!tokens.includes(k)) tokens.push(k); });

  for (const tok of tokens) {
    try {
      s = s.replace(new RegExp(tok, 'g'), ' ' + tok + ' ');
    } catch (_) {}
  }

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();
  // If result is still a single token (no spaces), try segmentation via vocab-based DP
  if (s.indexOf(' ') === -1) {
    const segmented = segmentConcatenated(s);
    if (segmented && segmented.indexOf(' ') !== -1) return segmented;
  }
  return s;
}

function segmentConcatenated(s) {
  if (!s) return s;
  // build dictionary of candidate tokens
  const dict = new Set([
    'i','have','feel','fever','headache','cough','sore','throat','vomit','nausea','pain','chills',
    'dizziness','cold','flu','temperature','breath','breathing','shortness','stomach','diarrhea',
    'rash','itch','vomiting','and','or','for','day','days','din','khansi','bukhar','sar','dard','saans'
  ]);
  // include URDU keys
  Object.keys(URDU_MAP).forEach(k => dict.add(k));
  // include symptom vocab
  for (const v of SYMPTOM_VOCAB) dict.add(v);

  const n = s.length;
  const dp = Array(n + 1).fill(-Infinity);
  const back = Array(n + 1).fill(-1);
  dp[0] = 0;

  for (let i = 0; i < n; i++) {
    if (dp[i] < -1e9) continue;
    for (let j = i + 1; j <= Math.min(n, i + 30); j++) {
      const word = s.slice(i, j);
      let score = -1000;
      // avoid single-letter tokens unless known
      if (word.length === 1 && !dict.has(word)) continue;
      if (dict.has(word)) score = word.length * 10 + 50; // strongly prefer known words
      else score = word.length * 0.1; // small score for unknown
      if (dp[i] + score > dp[j]) {
        dp[j] = dp[i] + score;
        back[j] = i;
      }
    }
  }

  if (dp[n] < 0) return s; // give up
  // reconstruct
  const parts = [];
  let idx = n;
  while (idx > 0) {
    const i = back[idx];
    if (i === -1) { parts.length = 0; break; }
    parts.push(s.slice(i, idx));
    idx = i;
  }
  if (parts.length === 0) return s;
  return parts.reverse().join(' ');
}

function cleanText(input) {
  if (!input || typeof input !== 'string') return '';
  let s = input.replace(/[^A-Za-z0-9\s,.:\/\-]/g, ' '); // remove strange punctuation (avoid Unicode property escapes)
  // collapse repeating characters e.g., cooool -> cool
  s = s.replace(/([a-zA-Z])\1{2,}/g, '$1$1');
  // normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // fix repeated punctuation
  s = s.replace(/[\.]{2,}/g, '.');
  // leading lowercase -> capitalize first character of sentence
  if (s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

function translateRomanUrduToEnglish(text) {
  if (!text) return text;
  let s = text.toLowerCase();
  Object.entries(URDU_MAP).forEach(([k, v]) => {
    s = s.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
  });
  // collapse double spaces
  s = s.replace(/\s+/g, ' ').trim();
  // capitalize
  if (s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

// Very small spelling corrections map; more can be derived from vocab
const SPELL_FIXES = {
  'fevr': 'fever',
  'feaver': 'fever',
  'hedache': 'headache',
  'hedache': 'headache',
  'couhg': 'cough',
  'cofgh': 'cough',
};

function spellCorrectToken(token) {
  if (!token) return token;
  const t = token.toLowerCase();
  if (SPELL_FIXES[t]) return SPELL_FIXES[t];
  // exact vocab match
  if (SYMPTOM_VOCAB.has(t)) return t;
  // fuzzy match against vocab: pick best candidate with distance threshold
  let best = null;
  let bestScore = Infinity;
  for (const v of SYMPTOM_VOCAB) {
    const d = levenshtein(t, v);
    if (d < bestScore) {
      bestScore = d;
      best = v;
    }
  }
  if (best && bestScore <= Math.max(1, Math.floor(t.length * 0.3))) {
    return best;
  }
  return token;
}

function extractDurations(text) {
  const durations = [];
  const re = /(\b\d{1,3}\b)\s*(day|days|days\b|din|dinon|week|weeks|week\b)/i;
  const m = text.match(re);
  if (m) durations.push({ raw: m[0], value: Number(m[1]), unit: m[2] });
  return durations;
}

function extractSeverity(text) {
  const sev = [];
  const mapping = {
    severe: ['severe', 'very', 'boht', 'bohat', 'bahut', 'zyaada', 'extreme', 'high'],
    mild: ['mild', 'slight', 'thoda', 'kam'],
  };
  const lowered = text.toLowerCase();
  Object.entries(mapping).forEach(([k, arr]) => {
    for (const token of arr) if (lowered.includes(token)) { sev.push(k); break; }
  });
  return sev;
}

function extractBodyParts(text) {
  const parts = [];
  const mapping = ['chest', 'throat', 'head', 'stomach', 'ear', 'eye', 'back', 'leg', 'arm'];
  const lowered = text.toLowerCase();
  mapping.forEach(p => { if (lowered.includes(p)) parts.push(p); });
  return parts;
}

function tokenize(text) {
  if (!text) return [];
  return text.split(/[,;:\.\-\/]|\band\b|\bwith\b|\bfor\b|\bfor\b|\bwhile\b/).map(s => s.trim()).filter(Boolean);
}

async function callLLMForUnderstanding(text) {
  // Integration point for an LLM. If process.env.LLM_API_URL is set, we will POST JSON { text }
  // Otherwise this returns null to indicate LLM not available.
  const url = process.env.LLM_API_URL;
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    return null;
  }
}

async function processSymptomText(input) {
  try {
    // Try to split concatenated words first (handles 'ihavefever' & roman-Urdu concatenations)
    const spaced = insertMissingSpaces(input || '');
    let language = detectLanguage(spaced);
    let text = cleanText(String(spaced || ''));
    if (language === 'ur') {
      // convert roman-Urdu to english tokens where possible
      text = translateRomanUrduToEnglish(text);
    }

    // Token-level splitting (short phrases)
    const phrases = tokenize(text);

    const extracted = [];
    const duration = extractDurations(text);
    const severity = extractSeverity(text);
    const bodyParts = extractBodyParts(text);

    // For each phrase, try to find symptom tokens
    for (const ph of phrases) {
      const words = ph.split(/\s+/).map(w => w.replace(/[^A-Za-z0-9]/g, '').toLowerCase()).filter(Boolean);
      for (const w of words) {
        const corrected = spellCorrectToken(w);
        // confidence heuristic
        let confidence = 0.5;
        if (w === corrected) confidence = 0.95; // exact
        else if (SPELL_FIXES[w]) confidence = 0.85;
        else confidence = 0.65;

        // skip common stop words
        if (STOP_WORDS.has(corrected)) continue;
        // if the corrected token is in vocab or is a known medical token, consider symptom
        if (SYMPTOM_VOCAB.has(corrected) || corrected.length > 2) {
          extracted.push({ text: corrected, original: w, confidence });
        }
      }
    }

    // dedupe and aggregate confidences
    const map = new Map();
    for (const e of extracted) {
      const key = e.text;
      if (!map.has(key)) map.set(key, { text: key, original: e.original, confidence: e.confidence });
      else {
        const cur = map.get(key);
        cur.confidence = Math.min(0.99, Math.max(cur.confidence, e.confidence));
        map.set(key, cur);
      }
    }

    const symptoms = Array.from(map.values()).map(s => ({ symptom: s.text, confidence: Math.round(s.confidence * 100) }));

    // Optionally call an LLM to improve structure (if configured)
    const llmResult = await callLLMForUnderstanding(input).catch(() => null);

    return {
      success: true,
      original: input,
      language,
      cleaned: text,
      phrases,
      durations: duration,
      severity,
      bodyParts,
      symptoms,
      llm: llmResult,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  processSymptomText,
  detectLanguage,
  cleanText,
  spellCorrectToken,
};
