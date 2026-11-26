// Testna baza data/fer-test.db - ista struktura kao što je profesor najavio:
// jedna tablica: jmbag, ime, prezime, url do slike ILI blob slike, mentor, naslov rada.
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs"),
	path = require("node:path");

const root = path.join(__dirname, "..");
const dir = process.env.DATA_DIR ?? path.join(root, "data");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, "fer-test.db");
fs.rmSync(file, { force: true });
const db = new DatabaseSync(file);

db.exec(`
  CREATE TABLE student (
    jmbag        TEXT PRIMARY KEY CHECK (length(jmbag) = 10),
    ime          TEXT NOT NULL,
    prezime      TEXT NOT NULL,
    slika_url    TEXT,
    slika        BLOB,
    mentor       TEXT,
    naslov_rada  TEXT
  );
`);

const studenti = [
	[
		"Luka",
		"Hacek",
		"prof. dr. sc. Ivo Ivić",
		"Sustav za prikaz studenata na videozidu u stvarnom vremenu",
	],
	[
		"Ana",
		"Horvat",
		"izv. prof. dr. sc. Maja Kovač",
		"Primjena dubokog učenja u klasifikaciji medicinskih slika",
	],
	[
		"Marko",
		"Kovačević",
		"prof. dr. sc. Petar Perić",
		"Optimizacija prevoditelja za ugradbene sustave",
	],
	[
		"Ivana",
		"Babić",
		"doc. dr. sc. Tena Marić",
		"Mikroservisna arhitektura web aplikacije za upravljanje rezervacijama",
	],
	[
		"Petra",
		"Marić",
		"prof. dr. sc. Ivo Ivić",
		"Analiza društvenih mreža primjenom teorije grafova",
	],
	[
		"Josip",
		"Jurić",
		"izv. prof. dr. sc. Goran Babić",
		"Programirljivi sklopovi za ubrzanje kriptografskih algoritama",
	],
	[
		"Lucija",
		"Novak",
		"izv. prof. dr. sc. Maja Kovač",
		"Predviđanje potrošnje električne energije vremenskim serijama",
	],
	[
		"Filip",
		"Knežević",
		"prof. dr. sc. Ante Šimić",
		"Upravljanje mobilnim robotom pomoću računalnog vida",
	],
	[
		"Ema",
		"Vuković",
		"doc. dr. sc. Krešimir Tomić",
		"Integracija obnovljivih izvora u distribucijsku mrežu",
	],
	[
		"Ivan",
		"Pavlović",
		"prof. dr. sc. Petar Perić",
		"Niskoenergetski senzorski čvor za Internet stvari",
	],
	[
		"Sara",
		"Božić",
		"izv. prof. dr. sc. Goran Babić",
		"Simulacija satelitske komunikacijske veze",
	],
	[
		"Matej",
		"Grgić",
		"prof. dr. sc. Ante Šimić",
		"Dizajn analognog pojačala za audio primjene",
	],
	[
		"Mia",
		"Šarić",
		"doc. dr. sc. Tena Marić",
		"Sigurnost autentifikacije u web aplikacijama",
	],
	[
		"Karlo",
		"Perić",
		"doc. dr. sc. Krešimir Tomić",
		"Numeričko modeliranje prijenosa topline metodom konačnih elemenata",
	],
	[
		"Lana",
		"Radić",
		"prof. dr. sc. Ivo Ivić",
		"Prostorni zvuk u sustavima virtualne stvarnosti",
	],
];

const palette = [
	"#2563eb",
	"#059669",
	"#d97706",
	"#7c3aed",
	"#db2777",
	"#0891b2",
	"#dc2626",
	"#4d7c0f",
];
const avatar = (ime, prezime, i) => {
	const c = palette[i % palette.length];
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs>
  <rect width="300" height="400" fill="url(#g)"/>
  <circle cx="150" cy="150" r="70" fill="#ffffff" fill-opacity=".85"/>
  <path d="M30 400 C30 290 270 290 270 400 Z" fill="#ffffff" fill-opacity=".85"/>
  <text x="150" y="172" font-size="64" font-weight="700" text-anchor="middle" fill="${c}" font-family="sans-serif">${ime[0]}${prezime[0]}</text>
</svg>`;
};

// Pola studenata ima sliku kao BLOB, pola kao URL (za test servirano iz public/test-slike/)
const urlDir = path.join(root, "public", "test-slike");
fs.rmSync(urlDir, { recursive: true, force: true });
fs.mkdirSync(urlDir, { recursive: true });

const ins = db.prepare("INSERT INTO student VALUES (?, ?, ?, ?, ?, ?, ?)");
const rows = studenti.map(([ime, prezime, mentor, naslov], i) => {
	const jmbag = `0036${String(500001 + i).padStart(6, "0")}`;
	const svg = avatar(ime, prezime, i);
	let url = null,
		blob = null;
	if (i % 2 === 0) blob = Buffer.from(svg);
	else {
		fs.writeFileSync(path.join(urlDir, `${i}.svg`), svg);
		url = `/test-slike/${i}.svg`;
	}
	ins.run(jmbag, ime, prezime, url, blob, mentor, naslov);
	return { jmbag, student: `${ime} ${prezime}`, slika: url ? "url" : "blob" };
});

console.log(`Baza: ${file}`);
console.table(rows);
