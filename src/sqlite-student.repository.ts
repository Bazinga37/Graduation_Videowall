import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { detectMime, Student, StudentPhoto, StudentRepository } from './students.repository';

const DB_FILE = process.env.DB_FILE ?? join(__dirname, '..', 'data', 'fer-test.db');

/** Testna baza (npm run seed). */
@Injectable()
export class SqliteStudentRepository extends StudentRepository implements OnModuleDestroy {
  private db = new DatabaseSync(DB_FILE, { readOnly: true });

  private studentStmt = this.db.prepare(
    'SELECT jmbag, ime, prezime, mentor, naslov_rada AS naslovRada FROM student WHERE jmbag = ?');

  private photoStmt = this.db.prepare(
    'SELECT slika, slika_url AS url FROM student WHERE jmbag = ?');

  async findByJmbag(jmbag: string): Promise<Student | undefined> {
    return this.studentStmt.get(jmbag) as Student | undefined;
  }

  async findPhoto(jmbag: string): Promise<StudentPhoto | undefined> {
    const row = this.photoStmt.get(jmbag) as { slika: Uint8Array | null; url: string | null } | undefined;
    if (row?.slika) {
      const data = Buffer.from(row.slika);
      return { kind: 'blob', data, mime: detectMime(data) };
    }
    if (row?.url) return { kind: 'url', url: row.url };
    return undefined;
  }

  onModuleDestroy() { this.db.close(); }
}
