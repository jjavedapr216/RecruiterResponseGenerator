import * as XLSX from 'xlsx';

export type MasterData = Map<string, string>;

export interface ExcelParseResult {
  masterData: MasterData;
  customSynonyms: Map<string, string>; // normalised synonym → fieldName
}

export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const masterData: MasterData = new Map();
  const customSynonyms = new Map<string, string>();

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

  if (rows.length < 2) return { masterData, customSynonyms };

  // Find column indices from header row (case-insensitive)
  const header = rows[0].map(h => String(h).toLowerCase().trim());
  const fieldCol = header.findIndex(h => h.includes('field'));
  const valueCol = header.findIndex(h => h === 'value' || h.includes('val'));
  const synCol   = header.findIndex(h => h.includes('syn'));

  if (fieldCol === -1 || valueCol === -1) return { masterData, customSynonyms };

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawKey = String(row[fieldCol] ?? '');
    const rawVal = String(row[valueCol] ?? '').trim();
    const key = cleanKey(rawKey);
    if (!key || !rawVal) continue;

    if (!masterData.has(key)) masterData.set(key, rawVal);

    if (synCol !== -1) {
      const synCell = String(row[synCol] ?? '').trim();
      if (synCell) {
        synCell.split(',').forEach(s => {
          const norm = s.trim().toLowerCase();
          if (norm) customSynonyms.set(norm, key);
        });
      }
    }
  }

  return { masterData, customSynonyms };
}

export function parseMasterData(raw: string): MasterData {
  const data = new Map<string, string>();
  if (!raw.trim()) return data;

  const lines = raw.split('\n');

  // Detect separator: compare tab vs comma density in first 20 lines
  const sample = lines.slice(0, 20).join('\n');
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const useTabs = tabCount > commaCount / 2;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    let key = '';
    let value = '';

    if (useTabs) {
      const idx = line.indexOf('\t');
      if (idx > -1) {
        key = line.substring(0, idx);
        value = line.substring(idx + 1).trim();
      } else {
        // Lines without a tab (e.g. "First Name:Javed") — fall back to colon
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          key = line.substring(0, colonIdx);
          value = line.substring(colonIdx + 1).trim();
        }
      }
    } else {
      // Find first unquoted comma
      let inQuote = false;
      let commaIdx = -1;
      for (let j = 0; j < line.length; j++) {
        if (line[j] === '"') inQuote = !inQuote;
        else if (line[j] === ',' && !inQuote) { commaIdx = j; break; }
      }

      if (commaIdx > -1) {
        key = line.substring(0, commaIdx);
        let rawVal = line.substring(commaIdx + 1).trim();

        if (rawVal.startsWith('"')) {
          rawVal = rawVal.slice(1);
          if (rawVal.endsWith('"')) {
            rawVal = rawVal.slice(0, -1);
          } else {
            // Multi-line quoted value — collect continuation lines
            const parts = [rawVal];
            i++;
            while (i < lines.length) {
              const nextLine = lines[i];
              if (nextLine.trimEnd().endsWith('"')) {
                parts.push(nextLine.trimEnd().slice(0, -1));
                break;
              }
              parts.push(nextLine);
              i++;
            }
            rawVal = parts.join('\n');
          }
        }
        value = rawVal;
      } else {
        // Fallback: colon separator
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          key = line.substring(0, colonIdx);
          value = line.substring(colonIdx + 1).trim();
        }
      }
    }

    key = cleanKey(key);
    value = value.replace(/^["'\s]+|["'\s]+$/g, '').trim();

    if (key && key.length > 0 && key.length < 100 && value) {
      if (!data.has(key)) {
        data.set(key, value);
      }
    }

    i++;
  }

  return data;
}

export function cleanKey(raw: string): string {
  return raw
    .replace(/[ÿ�]+/g, '')   // Remove BOM-like junk
    .replace(/^["'\s]+|["'\s]+$/g, '') // Strip quotes/spaces
    .replace(/\s*[*:]+\s*$/, '')       // Remove trailing * or :
    .trim();
}

// ─── Email / form field extraction ─────────────────────────────────────────

function cleanFieldName(s: string): string {
  return s
    .replace(/^["'\s*•\-▪◦‣]+/, '')
    .replace(/["'\s*]+$/, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*\[.*?\]\s*/g, ' ')
    .replace(/[ÿ�]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmptyOrPlaceholder(s: string): boolean {
  const t = s.trim();
  return !t
    || /^[\s_\-*.xX]+$/.test(t)
    || /^(?:N\/A|TBD|na|tbd|none|nil|enter here)$/i.test(t);
}

function isLikelyFieldName(s: string): boolean {
  if (s.length < 2 || s.length > 90) return false;
  if (s.split(/\s+/).length > 14) return false;
  // Reject phrases that are clearly instructions, not field names
  if (/\b(?:please|provide|share|send|submit|confirm|fill|kindly|required|mandatory)\b/i.test(s)) return false;
  if (/[.!]$/.test(s)) return false;
  return true;
}

export function extractRequestedFields(emailText: string): string[] {
  if (!emailText.trim()) return [];

  const fields: string[] = [];
  const seen = new Set<string>();
  const lines = emailText.split('\n');

  const addField = (raw: string) => {
    const cleaned = cleanFieldName(raw);
    if (!cleaned) return;
    const lower = cleaned.toLowerCase();
    if (!seen.has(lower) && isLikelyFieldName(cleaned)) {
      seen.add(lower);
      fields.push(cleaned);
    }
  };

  // Detect structured (CSV / TSV) format by counting separators
  const sample = lines.slice(0, 30).join('\n');
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const isStructured = tabCount > 5 || commaCount > 5;

  if (isStructured) {
    const useTabs = tabCount > commaCount;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (useTabs) {
        const idx = line.indexOf('\t');
        if (idx > -1) {
          const k = cleanFieldName(line.substring(0, idx).trim());
          const v = line.substring(idx + 1).trim();
          if (k && isEmptyOrPlaceholder(v) && isLikelyFieldName(k)) addField(k);
        }
      } else {
        // CSV: find first unquoted comma
        let inQuote = false;
        let commaIdx = -1;
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '"') inQuote = !inQuote;
          else if (line[j] === ',' && !inQuote) { commaIdx = j; break; }
        }

        if (commaIdx > -1) {
          const k = line.substring(0, commaIdx).trim().replace(/^["']|["']$/g, '');
          let v = line.substring(commaIdx + 1).trim();

          // Skip multi-line values (they have real content)
          if (v.startsWith('"')) {
            v = v.slice(1);
            if (!v.endsWith('"')) {
              // Consume continuation lines
              i++;
              while (i < lines.length && !lines[i].trimEnd().endsWith('"')) i++;
              i++;
              continue;
            }
            v = v.slice(0, -1);
          }

          if (k && isEmptyOrPlaceholder(v)) addField(k);
        }
      }
      i++;
    }

    if (fields.length >= 2) return fields;
  }

  // Plain text parsing
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 150) continue;

    // "Field Name :" with no value
    const formMatch = trimmed.match(/^([A-Za-z].{1,70}?)\s*[:*]+\s*(?:\*+)?\s*$/);
    if (formMatch) { addField(formMatch[1]); continue; }

    // "Field Name : placeholder"
    const placeholderMatch = trimmed.match(
      /^([A-Za-z].{1,65}?)\s*:\s*(?:_+|N\/A|TBD|\[.*?\]|\(.*?\)|xxx|---|\s*)$/i,
    );
    if (placeholderMatch) { addField(placeholderMatch[1]); continue; }

    // Numbered list: "1. Field" or "1) Field"
    const numberedMatch = trimmed.match(/^\d+\s*[.)]\s*(.{3,70}?)(?:\s*[*:])?$/);
    if (numberedMatch && !numberedMatch[1].match(/\b(is|are|was|were|will|should|can)\b/i)) {
      addField(numberedMatch[1]);
      continue;
    }

    // Bullet list
    const bulletMatch = trimmed.match(/^[•\-*▪◦‣]\s+(.{3,70}?)(?:\s*[*:])?$/);
    if (bulletMatch) { addField(bulletMatch[1]); continue; }

    // Bare label — short line with no colon/bullet/number (e.g. "Name", "Contact Number")
    if (trimmed.length >= 2 && trimmed.length <= 90 && isLikelyFieldName(trimmed) && !/[.!?]$/.test(trimmed)) {
      addField(trimmed);
    }
  }

  return fields;
}
