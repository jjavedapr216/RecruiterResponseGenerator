import { FIELDS, type FieldDef } from './synonyms';
import type { MasterData } from './parser';

export interface MatchedField {
  requestedLabel: string;
  canonicalId: string | null;
  canonicalLabel: string;
  value: string;
  sensitive: boolean;
  matched: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ÿÿ�]+/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 85;

  const wa = na.split(' ').filter(w => w.length > 1);
  const wb = nb.split(' ').filter(w => w.length > 1);

  if (wa.length > 0 && wb.length > 0) {
    const setB = new Set(wb);

    // Exact word overlap (Jaccard)
    const exactOverlap = wa.filter(w => setB.has(w));
    if (exactOverlap.length > 0) {
      const union = new Set([...wa, ...wb]).size;
      return Math.round((exactOverlap.length / union) * 80);
    }

    // Prefix/suffix word overlap — catches "linked" vs "linkedin", "auth" vs "authorization", etc.
    const partialOverlap = wa.filter(w =>
      wb.some(bw => bw.startsWith(w) || w.startsWith(bw)),
    ).length;
    if (partialOverlap > 0) {
      const union = new Set([...wa, ...wb]).size;
      return Math.round((partialOverlap / union) * 55);
    }
  }

  return 0;
}

function findCanonicalField(query: string): { def: FieldDef; score: number } | null {
  let best: { def: FieldDef; score: number } | null = null;

  for (const def of FIELDS) {
    const candidates = [def.label, ...def.synonyms];
    for (const c of candidates) {
      const s = scoreMatch(query, c);
      if (s > (best?.score ?? 40)) {
        best = { def, score: s };
      }
    }
  }

  return best;
}

function findValueInMaster(def: FieldDef, masterData: MasterData): string | null {
  const searchTerms = [def.label, ...def.synonyms];
  let bestKey: string | null = null;
  let bestScore = 40;

  for (const [key] of masterData) {
    for (const term of searchTerms) {
      const s = scoreMatch(key, term);
      if (s > bestScore) {
        bestScore = s;
        bestKey = key;
      }
    }
  }

  return bestKey ? (masterData.get(bestKey) ?? null) : null;
}

// Strict synonyms that unambiguously mean "full name" (no single-word matches like "name")
const FULL_NAME_STRICT_TERMS = [
  'full name', 'full legal name', 'candidate name', 'complete name',
  'legal name', 'complete legal name', 'candidate legal name',
  'candidate full name', 'candidate full legal name', 'candidate complete name',
];

function resolveFullName(masterData: MasterData): string {
  // 1. Try composition from First + Last — most reliable when available
  const firstDef = FIELDS.find(f => f.id === 'first_name')!;
  const lastDef  = FIELDS.find(f => f.id === 'last_name')!;
  const first = findValueInMaster(firstDef, masterData);
  const last  = findValueInMaster(lastDef,  masterData);
  const composed = [first, last].filter(Boolean).join(' ');
  if (composed) return composed;

  // 2. Fall back to an explicit "Full Name" / "Full Legal Name" key with strict matching
  let bestKey: string | null = null;
  let bestScore = 60; // high threshold — avoid false matches
  for (const [key] of masterData) {
    for (const term of FULL_NAME_STRICT_TERMS) {
      const s = scoreMatch(key, term);
      if (s > bestScore) { bestScore = s; bestKey = key; }
    }
  }
  return bestKey ? (masterData.get(bestKey) ?? '') : '';
}

export function matchFields(
  requestedFields: string[],
  masterData: MasterData,
  customSynonyms?: Map<string, string>,
): MatchedField[] {
  const results: MatchedField[] = [];
  const usedCanonicals = new Set<string>();

  for (const field of requestedFields) {
    // Check user-defined synonyms first (high-confidence override)
    let hit = findCanonicalField(field);
    if (customSynonyms?.size) {
      const normField = normalize(field);
      for (const [syn, fieldName] of customSynonyms) {
        if (scoreMatch(normField, syn) >= 85) {
          const customHit = findCanonicalField(fieldName);
          if (customHit && !usedCanonicals.has(customHit.def.id)) {
            hit = customHit;
          }
          break;
        }
      }
    }

    if (hit) {
      const { def } = hit;
      if (usedCanonicals.has(def.id)) continue;
      usedCanonicals.add(def.id);

      let value = findValueInMaster(def, masterData) ?? '';

      // If Full Name not found directly, try composing from First + Last
      if (def.id === 'full_name') {
        value = resolveFullName(masterData);
      }

      results.push({
        requestedLabel: field,
        canonicalId: def.id,
        canonicalLabel: def.label,
        value,
        sensitive: def.sensitive,
        matched: !!value,
      });
    } else {
      // No canonical match — try direct key lookup against master data
      let directValue: string | null = null;
      let directKey: string | null = null;
      let bestScore = 50;

      for (const [key, val] of masterData) {
        const s = scoreMatch(field, key);
        if (s > bestScore) {
          bestScore = s;
          directValue = val;
          directKey = key;
        }
      }

      const dedupKey = (directKey ?? field) + '_raw';
      if (!usedCanonicals.has(dedupKey)) {
        usedCanonicals.add(dedupKey);
        results.push({
          requestedLabel: field,
          canonicalId: null,
          canonicalLabel: directKey ?? field,
          value: directValue ?? '',
          sensitive: false,
          matched: !!directValue,
        });
      }
    }
  }

  return results;
}
