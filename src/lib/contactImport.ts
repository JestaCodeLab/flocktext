// The universal row shape produced by every import source (CSV/XLSX/TXT/PDF
// preview responses, vCard parsing, the phone contact picker) once normalized.
export interface PreviewRow {
  name: string;
  phone: string;
  dateOfBirth: string;
}

export type DuplicateType = 'file' | 'existing' | null;

export interface ImportRow extends PreviewRow {
  duplicateType: DuplicateType;
}

export function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, '');
}

export function annotateDuplicates(rows: PreviewRow[], existingPhones: Set<string>): ImportRow[] {
  const seen = new Set<string>();
  return rows.map((row) => {
    const digits = normalizePhoneDigits(row.phone);
    let duplicateType: DuplicateType = null;
    if (digits) {
      if (seen.has(digits)) duplicateType = 'file';
      else if (existingPhones.has(digits)) duplicateType = 'existing';
      seen.add(digits);
    }
    return { ...row, duplicateType };
  });
}
