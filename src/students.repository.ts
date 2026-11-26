export interface Student {
  jmbag: string;
  ime: string;
  prezime: string;
  mentor: string | null;
  naslovRada: string | null;
}

/** Slika je u bazi ili kao BLOB ili kao URL. */
export type StudentPhoto =
  | { kind: 'blob'; data: Buffer; mime: string }
  | { kind: 'url'; url: string };

/**
 * Ugovor prema izvoru podataka. Za FER-ovu bazu napravi novu klasu
 * (npr. PostgresStudentRepository) i zamijeni je u app.module.ts.
 */
export abstract class StudentRepository {
  abstract findByJmbag(jmbag: string): Promise<Student | undefined>;
  abstract findPhoto(jmbag: string): Promise<StudentPhoto | undefined>;
}

/** Prepoznaje format slike iz prvih bajtova (baza nema stupac za MIME tip). */
export function detectMime(b: Buffer): string {
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.subarray(0, 4).toString('hex') === '89504e47') return 'image/png';
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (b.subarray(0, 6).toString() === 'GIF8') return 'image/gif';
  if (b.subarray(0, 200).toString().includes('<svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
