import { useMemo, useRef, useState } from "react";
import {
  type Booking,
  formatDateLabel,
  formatReg,
  normReg,
  parseBookingsCsv,
  parseStorageExcel,
} from "@/lib/dagslistan";

export function Dagslistan() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [storage, setStorage] = useState<Map<string, string>>(new Map());
  const [csvName, setCsvName] = useState("");
  const [xlsName, setXlsName] = useState("");
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const csvRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);

  const dates = useMemo(
    () => [...new Set(bookings.map((b) => b.datum))].sort(),
    [bookings],
  );

  async function onCsv(f?: File) {
    if (!f) return;
    setError("");
    try {
      const buf = await f.arrayBuffer();
      let text = new TextDecoder("utf-8").decode(buf);
      if (text.includes("\uFFFD")) text = new TextDecoder("windows-1252").decode(buf);
      const list = parseBookingsCsv(text);
      setBookings(list);
      setCsvName(`${f.name} (${list.length})`);
      const ds = [...new Set(list.map((b) => b.datum))].sort();
      const today = new Date().toLocaleDateString("sv-SE");
      setDate(ds.includes(today) ? today : (ds[0] ?? ""));
    } catch {
      setError("Kunde inte läsa CSV-filen.");
    }
  }

  async function onXls(f?: File) {
    if (!f) return;
    setError("");
    try {
      const map = await parseStorageExcel(await f.arrayBuffer());
      if (!map.size) setError("Hittade inga kolumner för Regnr och Hyllplats/Lagerplats i Excel-filen.");
      setStorage(map);
      setXlsName(`${f.name} (${map.size})`);
    } catch {
      setError("Kunde inte läsa Excel-filen.");
    }
  }

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const sReg = normReg(q);
    return bookings
      .filter((b) => b.datum === date)
      .filter(
        (b) =>
          !s ||
          b.kund.toLowerCase().includes(s) ||
          (sReg && normReg(b.regnr).includes(sReg)),
      )
      .sort((a, b) => a.tid.localeCompare(b.tid));
  }, [bookings, date, q]);

  const dense = rows.length > 30 ? "print-dense" : "";

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="no-print border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dagslistan</h1>
            <p className="text-sm text-muted-foreground">Dagens bokningar med lagerplatser · Exempelfiler: <a className="underline" href="./exempel/exempel-bokningar.csv" download>CSV</a>, <a className="underline" href="./exempel/exempel-lagerplatser.xlsx" download>Excel</a></p>
          </div>
          <button className="btn btn-primary" disabled={!rows.length} onClick={() => window.print()}>Skriv ut A4</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6 print:p-0">
        <input ref={csvRef} type="file" accept=".csv,text/csv,.txt" hidden onChange={(e) => { onCsv(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={xlsRef} type="file" accept=".xlsx,.xls,.xlsm,.csv" hidden onChange={(e) => { onXls(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="no-print mb-6 grid gap-3 sm:grid-cols-2">
          {[
            { label: "1. Bokningar (CSV)", name: csvName, ref: csvRef },
            { label: "2. Lagerplatser (Excel)", name: xlsName, ref: xlsRef },
          ].map((c) => (
            <button key={c.label} onClick={() => c.ref.current?.click()} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted">
              <span>
                <span className="block text-sm font-semibold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.name || "Klicka för att välja fil"}</span>
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${c.name ? "bg-primary" : "bg-border"}`} />
            </button>
          ))}
        </div>

        {error && <p className="no-print mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        {bookings.length > 0 && (
          <div className="no-print mb-4 flex flex-wrap items-center gap-3">
            <select value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize">
              {dates.map((d) => (
                <option key={d} value={d}>{formatDateLabel(d)} ({d})</option>
              ))}
            </select>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sök regnr eller namn…"
              className="ml-auto h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="no-print rounded-lg border border-dashed border-border bg-background p-12 text-center text-sm text-muted-foreground">
            Läs in bokningsfilen (CSV) och lagerplatserna (Excel) för att skapa dagens lista.
            <br />Allt hanteras lokalt i webbläsaren – inget sparas eller skickas.
          </div>
        ) : (
          <section className={`sheet ${dense}`}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold capitalize">{formatDateLabel(date)} <span className="font-normal text-muted-foreground">{date}</span></h2>
              <span className="text-sm text-muted-foreground">{rows.length} bokningar</span>
            </div>
            <table className="day-table">
              <thead>
                <tr>
                  <th className="w-16">Tid</th>
                  <th className="w-28">Regnummer</th>
                  <th>Tjänst</th>
                  <th className="w-28">Lagerplats</th>
                  <th>Namn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => (
                  <tr key={i}>
                    <td className="tabular-nums">{b.tid}</td>
                    <td className="font-bold whitespace-nowrap">{formatReg(b.regnr)}</td>
                    <td>{b.tjanst}</td>
                    <td className="font-medium whitespace-nowrap">{storage.get(normReg(b.regnr)) ?? "–"}</td>
                    <td>{b.kund}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Inga träffar.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
