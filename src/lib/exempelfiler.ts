// Exempelfiler skapas i minnet – ingen server behövs.
const CSV = "Förnamn,Efternamn,E-post,Företag,Datum,Starttid,Sluttid,Bokning,Formulär\nTest,Testsson,test@example.com,,\"1 januari, 2030\",08:00,08:00,\"1 januari, 2030 from 08:00\",\"REG nr\nABC123\n\nTelefon\n0700000000\n\nDäcken jag vill skifta till...\när förvarade hos MLK Bilservice\n\nDäcken jag skiftar från...\nvill jag förvara hos MLK Bilservice\"\nAnna,Exempel,test@example.com,,\"1 januari, 2030\",08:30,08:30,\"1 januari, 2030 from 08:30\",\"REG nr\nXYZ12A\n\nTelefon\n0700000000\n\nDäcken jag vill skifta till...\nhar jag med mig\n\nDäcken jag skiftar från...\ntar jag med mig\"\nPer,Prov,test@example.com,,\"1 januari, 2030\",09:00,09:00,\"1 januari, 2030 from 09:00\",\"REG nr\nDEF456\n\nTelefon\n0700000000\n\nDäcken jag vill skifta till...\nhar jag med mig\n\nDäcken jag skiftar från...\nvill jag förvara hos MLK Bilservice\"\nLisa,Demo,test@example.com,,\"1 januari, 2030\",09:30,09:30,\"1 januari, 2030 from 09:30\",\"REG nr\nGHI789\n\nTelefon\n0700000000\n\nDäcken jag vill skifta till...\när förvarade hos MLK Bilservice\n\nDäcken jag skiftar från...\ntar jag med mig\"\n";

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function laddaNerExempelCsv() {
  save(new Blob(["\uFEFF" + CSV], { type: "text/csv;charset=utf-8" }), "exempel-bokningar.csv");
}

export async function laddaNerExempelExcel() {
  const m = await import("xlsx/xlsx.mjs");
  const XLSX = ((m as unknown as { default?: typeof m }).default?.write ? (m as unknown as { default: typeof m }).default : m);
  const ws = XLSX.utils.aoa_to_sheet([["Regnr", "Lagerplats"], ["ABC123", "A12-2"], ["GHI789", "B03-1"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lagerplatser");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  save(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "exempel-lagerplatser.xlsx");
}
