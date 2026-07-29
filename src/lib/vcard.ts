export interface PreviewRow {
  name: string;
  phone: string;
  dateOfBirth: string;
}

// vCard lines are "folded" at 75 octets: a continuation line starts with a
// single space or tab, which must be stripped and joined to the previous line
// before any property parsing happens (RFC 6350 §3.2).
function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\r|\n/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.trim()) {
      lines.push(line);
    }
  }
  return lines;
}

interface ParsedLine {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): ParsedLine | null {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;

  const head = line.slice(0, colonIndex);
  let value = line.slice(colonIndex + 1);
  const [name, ...paramParts] = head.split(';');

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [key, val = ''] = part.split('=');
    params[key.trim().toUpperCase()] = val.trim().toUpperCase();
  }

  if (params.ENCODING === 'QUOTED-PRINTABLE') {
    value = value.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  }

  return { name: name.trim().toUpperCase(), params, value: value.trim() };
}

// vCard 3.0 BDAY is YYYYMMDD (no dashes); 4.0 is YYYY-MM-DD. Normalize to the
// dashed form the server's `Date.parse` on the import endpoint expects.
function normalizeBirthday(raw: string): string {
  const digitsOnly = /^\d{8}$/;
  if (digitsOnly.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function nameFromStructured(value: string): string {
  // N: Family;Given;Middle;Prefix;Suffix
  const [family = '', given = ''] = value.split(';');
  return `${given} ${family}`.trim();
}

function parseCard(lines: string[]): PreviewRow | null {
  let name = '';
  let structuredName = '';
  let phone = '';
  let preferredPhone = '';
  let dateOfBirth = '';

  for (const rawLine of lines) {
    const parsed = parseLine(rawLine);
    if (!parsed) continue;

    if (parsed.name === 'FN' && !name) {
      name = parsed.value;
    } else if (parsed.name === 'N' && !structuredName) {
      structuredName = nameFromStructured(parsed.value);
    } else if (parsed.name === 'TEL') {
      if (!phone) phone = parsed.value;
      const type = parsed.params.TYPE || '';
      if (!preferredPhone && (type.includes('CELL') || type.includes('MOBILE'))) {
        preferredPhone = parsed.value;
      }
    } else if (parsed.name === 'BDAY') {
      dateOfBirth = normalizeBirthday(parsed.value);
    }
  }

  const resolvedName = name || structuredName;
  const resolvedPhone = preferredPhone || phone;
  if (!resolvedName && !resolvedPhone) return null;

  return { name: resolvedName, phone: resolvedPhone, dateOfBirth };
}

export function parseVCard(text: string): PreviewRow[] {
  const lines = unfoldLines(text);
  const rows: PreviewRow[] = [];

  let current: string[] | null = null;
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper === 'BEGIN:VCARD') {
      current = [];
    } else if (upper === 'END:VCARD') {
      if (current) {
        const row = parseCard(current);
        if (row) rows.push(row);
      }
      current = null;
    } else if (current) {
      current.push(line);
    }
  }

  return rows;
}
