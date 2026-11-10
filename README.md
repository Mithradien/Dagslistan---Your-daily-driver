# Dagslistan: Your Daily Driver

Bygg ett fristående, blixtsnabbt webbverktyg som heter "Dagslistan".
Verktyget ska fungera 100 % lokalt i webbläsarens minne utan någon databas eller inloggning.

### Funktioner:
1. Två filimport-knappar längst upp:
   - "Läs in CSV (Bokningar)": Läser in dagens/veckans bokningsfil (Datum, Starttid, Regnr, Tjänst, Kundnamn, Telefon).
   - "Läs in Excel (Lagerplatser)": Läser in ABS-exporten med däckhotell/lagerplatser (Regnr och Hyllplats/Lagerplats, t.ex. A12-2).
2. Automatisk matchning i minnet: När båda filerna läses in matchas bokningens regnummer direkt mot lagerplatserna från Excelen.
3. Datumväljare: Om CSV-filen innehåller flera datum ska man enkelt kunna klicka mellan dagarna.
4. Sökruta: Sök på registreringsnummer eller kundnamn.
5. Knapp för "Skriv ut A4":
   - Vid klick aktiveras window.print().
   - Sidan ska ha en ren print-stilmall (@media print) som döljer knappar, menyer och sökruta.
   - Tabellraderna ska komprimeras så att hela dagens lista ryms snyggt och prydligt på ett enda stående A4-ark utan att spilla över till sida 2.

### Tabell (Exakt dessa 5 kolumner):
1. Tid (starttid, t.ex. 08:00)
2. Regnummer (i fet text, t.ex. ABC 123)
3. Tjänst (t.ex. Skifte och förvaring)
4. Lagerplats (t.ex. A12-2, eller ett streck om bilen saknar förvaring)
5. Kund (kundens namn)

### Design & Drift:
- Rent, avskalat och professionellt gränssnitt (Tailwind CSS, diskret grå/vit bakgrund, tydlig typografi).
- Inga externa beroenden, inga molntjänster, inga sparade kakor eller tokens.
- Skapa även en Dockerfile (Nginx Alpine) och en docker-compose.yml så att verktyget enkelt kan köras som en fristående container på port 8085 på en egen server.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9da8815d-7ed2-460f-a4b3-2936378f07bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
