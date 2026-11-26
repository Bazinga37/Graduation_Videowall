import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Student } from "./students.repository";

/** Ono što ide na videozid. NAMJERNO bez JMBAG-a (povjerljivo). */
export interface Slide {
	id: string; // nasumičan, nije povezan s JMBAG-om
	ime: string;
	prezime: string;
	mentor: string | null;
	naslovRada: string | null;
	photoUrl: string;
	durationMs: number;
}

interface QueueItem {
	jmbag: string;
	slide: Slide;
}

const DISPLAY_MS = Number(process.env.DISPLAY_MS ?? 15000); // koliko dugo je student na zidu
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS ?? 60000); // isti JMBAG ne može ponovno odmah

/** Red čekanja: svaki student dobije svojih N sekundi, jedan po jedan, pa natrag na QR. */
@Injectable()
export class DisplayService {
	private queue: QueueItem[] = [];
	private current: QueueItem | null = null;
	private lastShown = new Map<string, number>();
	private slideToJmbag = new Map<string, string>(); // samo na serveru, za dohvat slike
	private listener: (slide: Slide | null) => void = () => {};

	onChange(fn: (slide: Slide | null) => void) {
		this.listener = fn;
	}
	getCurrent(): Slide | null {
		return this.current?.slide ?? null;
	}
	jmbagForSlide(id: string) {
		return this.slideToJmbag.get(id);
	}

	/** Vraća poziciju u redu (0 = odmah na zidu). */
	enqueue(
		s: Student,
	): { ok: true; position: number } | { ok: false; reason: string } {
		const now = Date.now();
		if (
			this.current?.jmbag === s.jmbag ||
			this.queue.some((q) => q.jmbag === s.jmbag)
		) {
			return { ok: false, reason: "Već si u redu za prikaz." };
		}
		const last = this.lastShown.get(s.jmbag);
		if (last && now - last < COOLDOWN_MS) {
			return { ok: false, reason: "Upravo si bio/la na zidu, pričekaj malo." };
		}
		const id = randomUUID();
		this.slideToJmbag.set(id, s.jmbag);
		this.queue.push({
			jmbag: s.jmbag,
			slide: {
				id,
				ime: s.ime,
				prezime: s.prezime,
				mentor: s.mentor,
				naslovRada: s.naslovRada,
				photoUrl: `/api/slide/${id}/photo`,
				durationMs: DISPLAY_MS,
			},
		});
		const position = this.current ? this.queue.length : 0;
		if (!this.current) this.next();
		return { ok: true, position };
	}

	private next() {
		const prev = this.current;
		this.current = this.queue.shift() ?? null;
		// slika prethodnog slajda više nije dostupna (malo kasnije, da zid stigne fade-out)
		if (prev) setTimeout(() => this.slideToJmbag.delete(prev.slide.id), 5000);
		if (this.current) this.lastShown.set(this.current.jmbag, Date.now());
		this.listener(this.getCurrent());
		if (this.current) setTimeout(() => this.next(), DISPLAY_MS);
	}
}
