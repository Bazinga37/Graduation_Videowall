# Videozid – promocija FER

Student skenira QR na videozidu → upiše JMBAG → zid 15 s prikazuje sliku, ime i smjer → vraća se na QR.

## Pokretanje
```bash
npm install
npm run seed      # testna SQLite baza: 15 studenata, JMBAG 0036500001–0036500015
npm run build && npm start
```
- Forma (mobitel): http://localhost:3000/
- Videozid (fullscreen, F11): http://localhost:3000/wall.html

## Podaci
Testna baza `data/fer-test.db` (SQLite, ugrađen u Node 22) ima istu strukturu kao buduća FER-ova tablica:

| stupac | opis |
|---|---|
| `jmbag` | ključ za pretragu, **nikad se ne prikazuje** |
| `ime`, `prezime` | |
| `slika_url` ili `slika` (BLOB) | jedno od dvoje; BLOB format (jpg/png/webp/svg) se sam prepoznaje |
| `mentor` | |
| `naslov_rada` | završni ili diplomski |

Spajanje na FER-ovu bazu: napravi novu klasu koja nasljeđuje `StudentRepository`
(`src/students.repository.ts`) i zamijeni je u `src/app.module.ts`. Ostatak aplikacije se ne mijenja.

## Konfiguracija (env)
| Var | Default | Opis |
|---|---|---|
| `PORT` | 3000 | |
| `PUBLIC_URL` | host iz requesta | URL u QR kodu – **obavezno postavi na javnu adresu** |
| `DISPLAY_MS` | 15000 | koliko dugo je student na zidu |
| `COOLDOWN_MS` | 60000 | isti JMBAG ne može ponovno odmah |
| `DB_FILE` | ./data/fer-test.db | putanja do testne baze |

## Kako radi
- `POST /api/submit {jmbag}` → validacija (10 znamenki, mora biti na popisu) → red čekanja
- Red: studenti idu jedan po jedan, svaki po `DISPLAY_MS`; duplikati u redu se odbijaju
- JMBAG nikad ne ide prema zidu: zid dobiva nasumični ID slajda, a slika ide preko `/api/slide/<id>/photo`
- Zid dobiva `show` / `idle` evente preko socket.io; nakon reconnecta odmah dobije trenutno stanje
- Rate limit: 5 pokušaja/min po IP-u

## Za dizajnera
JS ovisi samo o `id`-evima (`idle`, `qr`, `student`, `photo`, `name`, `naslov`, `mentor`, `form`, `jmbag`, `btn`, `msg`).
Sve ostalo (klase, CSS varijable u `:root`, layout) slobodno mijenjati.
