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

export function parseBookingsCsv(text: string): Booking[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const first = lines[0]!;
  const sep = [";", ",", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0]!;
  const headers = splitLine(first, sep).map(normHeader);
  const find = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
  const iDatum = find("datum", "date");
  const iTid = find("starttid", "tid", "time", "start");
  const iReg = find("regnr", "regnummer", "registrering", "reg");
  const iTj = find("tjanst", "service", "arbete");
  const iKund = find("kundnamn", "kund", "namn", "name");
  const iTel = find("telefon", "tel", "mobil", "phone");
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "") : "");
  return lines.slice(1).map((l) => {
    const r = splitLine(l, sep);
    return {
      datum: normDate(get(r, iDatum)),
      tid: normTime(get(r, iTid)),
      regnr: get(r, iReg),
      tjanst: mapTjanst(get(r, iTj)),
      kund: get(r, iKund),
      telefon: get(r, iTel),
    };
  }).filter((b) => b.regnr || b.kund);
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
