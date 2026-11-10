export type Booking = {
  datum: string;
  tid: string;
  regnr: string;
  tjanst: string;
  kund: string;
  telefon: string;
};

export const normReg = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const formatReg = (s: string) => {
  const n = normReg(s);
  const m = n.match(/^([A-Z]{3})(\d{2}[A-Z0-9])$/);
  return m ? `${m[1]!} ${m[2]!}` : s.trim().toUpperCase();
};

const normHeader = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function normTime(t: string) {
  const m = t.match(/(\d{1,2})[:.](\d{2})/);
  return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : t;
}

function normDate(d: string) {
  const s = d.trim().split(/[ T]/)[0] ?? "";
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return `${m[1]!}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]!}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  return s;
}

export function mapTjanst(raw: string): string {
  const t = raw.toLowerCase();
  const harMed = /har med/.test(t);
  const finnsHos = /finns hos/.test(t);
  const tarMed = /tar med/.test(t);
  const forvara = /f(ö|o)rvara/.test(t);
  if (harMed && tarMed) return "Skifte";
  if (harMed && forvara) return "Nyförvaring";
  if (finnsHos && forvara && !tarMed) return "Skifte med förvaring";
  if ((finnsHos || forvara) && tarMed) return "Avslut";
  return raw;
}

function parseCsvRecords(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur.trim()); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur.trim()); cur = "";
      if (row.some((x) => x)) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur.trim());
  if (row.some((x) => x)) rows.push(row);
  return rows;
}

const MONTHS: Record<string, number> = {
  januari: 1, january: 1, februari: 2, february: 2, mars: 3, march: 3, april: 4, maj: 5, may: 5,
  juni: 6, june: 6, juli: 7, july: 7, augusti: 8, august: 8, september: 9, oktober: 10, october: 10,
  november: 11, december: 12,
};

function textDate(s: string): string | null {
  const m = s.toLowerCase().match(/^(\d{1,2})\.?\s+([a-zåäö]+),?\s+(\d{4})$/);
  if (!m || !MONTHS[m[2]!]) return null;
  return `${m[3]}-${String(MONTHS[m[2]!]).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

export function tjanstFromForm(form: string): string {
  const t = form.toLowerCase();
  const iTill = t.indexOf("skifta till");
  const iFran = t.indexOf("skiftar fr");
  if (iTill < 0 && iFran < 0) return mapTjanst(form);
  const till = iTill >= 0 ? t.slice(iTill, iFran > iTill ? iFran : undefined) : "";
  const fran = iFran >= 0 ? t.slice(iFran, iTill > iFran ? iTill : undefined) : "";
  const finnsHos = /f(ö|o)rvarade|finns/.test(till);
  const forvaraNu = /f(ö|o)rvara/.test(fran);
  if (!finnsHos && !forvaraNu) return "Skifte";
  if (!finnsHos && forvaraNu) return "Nyförvaring";
  if (finnsHos && forvaraNu) return "Skifte med förvaring";
  return "Avslut";
}

function regFromForm(form: string): string {
  const m = form.match(/reg\.?\s*n(?:r|ummer)\.?\s*:?\s*([A-Za-z0-9 ]{2,10})/i);
  if (m) return normReg(m[1]!.split(/\n/)[0]!);
  const m2 = form.toUpperCase().match(/\b([A-Z]{3}\s?\d{2}[A-Z0-9])\b/);
  return m2 ? normReg(m2[1]!) : "";
}

export function parseBookingsCsv(text: string): Booking[] {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/)[0] ?? "";
  const sep = [";", ",", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0]!;
  const rows = parseCsvRecords(text, sep);
  if (!rows.length) return [];
  const headers = rows[0]!.map(normHeader);
  const find = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
  const iFor = find("fornamn", "firstname", "first");
  const iEft = find("efternamn", "lastname", "last");
  const out: Booking[] = [];
  for (const r of rows) {
    const formIdx = r.findIndex((f) => /reg\.?\s*n(r|ummer)/i.test(f));
    if (formIdx < 0) continue;
    const form = r[formIdx]!;
    const regnr = regFromForm(form);
    if (!regnr) continue;
    let datum = "", tid = "";
    for (let i = 0; i < formIdx; i++) {
      const f = r[i]!;
      if (!datum) { const d = textDate(f) ?? (/^\d{4}-\d{2}-\d{2}/.test(f) ? normDate(f) : null); if (d) { datum = d; continue; } }
      if (!tid && /^\d{1,2}[:.]\d{2}$/.test(f)) tid = normTime(f);
    }
    const fn = iFor >= 0 ? r[iFor] ?? "" : r[0] ?? "";
    const en = iEft >= 0 ? r[iEft] ?? "" : r[1] ?? "";
    const tel = form.match(/telefon\s*\n?\s*([+\d][\d \-]{5,})/i)?.[1]?.trim() ?? "";
    out.push({ datum, tid, regnr, tjanst: tjanstFromForm(form), kund: `${fn} ${en}`.trim(), telefon: tel });
  }
  return out;
}

export async function parseStorageExcel(buf: ArrayBuffer): Promise<Map<string, string>> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  const map = new Map<string, string>();
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name]!, { header: 1, defval: "" });
    // hitta rubrikraden
    let hIdx = -1, iReg = -1, iPlats = -1;
    for (let r = 0; r < Math.min(rows.length, 20); r++) {
      const h = (rows[r] as unknown[]).map((c) => normHeader(String(c)));
      const ir = h.findIndex((x) => x.includes("regnr") || x.includes("regnummer") || x.includes("registrering") || x === "reg");
      const ip = h.findIndex((x) => x.includes("hyll") || x.includes("lagerplats") || x.includes("plats") || x.includes("location"));
      if (ir >= 0 && ip >= 0) { hIdx = r; iReg = ir; iPlats = ip; break; }
    }
    if (hIdx < 0) continue;
    for (const row of rows.slice(hIdx + 1) as unknown[][]) {
      const reg = normReg(String(row[iReg] ?? ""));
      const plats = String(row[iPlats] ?? "").trim();
      if (!reg || !plats) continue;
      const prev = map.get(reg);
      if (!prev) map.set(reg, plats);
      else if (!prev.split(", ").includes(plats)) map.set(reg, `${prev}, ${plats}`);
    }
  }
  return map;
}

export function formatDateLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return iso || "Utan datum";
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}
