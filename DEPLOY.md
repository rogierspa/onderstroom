# De Onderstroom — Deploy instructie
Stap-voor-stap van nul naar live app met push notificaties.
Tijdsinschatting: ~45 minuten.

---

## Stap 1 — Accounts aanmaken (5 min)

Maak accounts aan op (allemaal gratis):
- https://github.com — voor de code
- https://vercel.com — voor hosting (log in met GitHub)
- https://supabase.com — voor de database

---

## Stap 2 — Database opzetten in Supabase (5 min)

1. Ga naar supabase.com → New Project
2. Kies een naam (bijv. "onderstroom") en wachtwoord → Create
3. Wacht tot het project klaar is (~2 min)
4. Ga naar SQL Editor → New Query
5. Plak de inhoud van `supabase/schema.sql` → klik Run
6. Ga naar Settings → API
7. Kopieer de **Project URL** en **anon public key** — je hebt ze zo nodig

---

## Stap 3 — Code op GitHub zetten (5 min)

Open Terminal (Mac) of Command Prompt (Windows):

```bash
# Navigeer naar de project map
cd pad/naar/onderstroom

# Installeer dependencies
npm install

# Initialiseer git
git init
git add .
git commit -m "eerste versie"

# Maak een nieuw repo op github.com → New Repository → "onderstroom"
# Kopieer de remote URL en voer uit:
git remote add origin https://github.com/JOUWNAAM/onderstroom.git
git push -u origin main
```

---

## Stap 4 — VAPID keys genereren (2 min)

In dezelfde terminal:

```bash
npx web-push generate-vapid-keys
```

Dit geeft twee keys. Bewaar ze — je hebt ze in stap 5 nodig.

---

## Stap 5 — Deployen op Vercel (5 min)

1. Ga naar vercel.com → New Project
2. Importeer je GitHub repo "onderstroom"
3. Klik op **Environment Variables** en voeg toe:

| Naam | Waarde |
|------|--------|
| NEXT_PUBLIC_SUPABASE_URL | jouw Supabase Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | jouw Supabase anon key |
| ANTHROPIC_API_KEY | jouw Anthropic API key (console.anthropic.com) |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | de public key uit stap 4 |
| VAPID_PRIVATE_KEY | de private key uit stap 4 |
| VAPID_MAILTO | jouw emailadres |
| CRON_SECRET | verzin een willekeurig wachtwoord (bijv. "onderstroom-2024-xyz") |

4. Klik **Deploy** → wacht ~2 minuten
5. Vercel geeft je een URL: bijv. `onderstroom.vercel.app`

---

## Stap 6 — Cron beveiliging instellen (2 min)

De cron jobs (dagelijkse en weekelijkse reminders) roepen `/api/push/send` aan.
Ze zijn beveiligd met de `CRON_SECRET` die je in stap 5 hebt ingesteld.

Vercel Cron wordt automatisch geconfigureerd via `vercel.json`:
- Dagelijks om 07:00 UTC → dagboek reminder
- Vrijdag om 18:00 UTC → weekreflectie reminder

---

## Stap 7 — App installeren op telefoon (2 min)

De app is een Progressive Web App (PWA) — geen App Store nodig.

**iPhone (Safari):**
1. Open jouw Vercel URL in Safari
2. Tik op het Deel-icoontje (vierkantje met pijl omhoog)
3. Kies "Zet op beginscherm"

**Android (Chrome):**
1. Open de URL in Chrome
2. Tik op de drie puntjes rechtsboven
3. Kies "Toevoegen aan startscherm"

---

## Stap 8 — Notificaties aanzetten (1 min)

1. Open de app
2. Klik op "Notificaties aanzetten" in de banner of sidebar
3. Geef toestemming als je browser daarom vraagt
4. Klaar — je ontvangt voortaan:
   - Elke ochtend 07:00: dagboek reminder
   - Elke vrijdag 18:00: weekreflectie reminder

---

## Toekomstige updates

Elke keer dat je code aanpast en pusht naar GitHub, herdeployt Vercel automatisch.

```bash
git add .
git commit -m "beschrijving van wijziging"
git push
```

---

## Problemen?

**App laadt niet:** Controleer of alle environment variables correct zijn ingesteld in Vercel.

**Notificaties werken niet:** 
- Controleer of VAPID keys correct zijn (public key begint met "BA")
- iOS vereist Safari en minimaal iOS 16.4
- Push werkt alleen via HTTPS (dus niet op localhost)

**Database fout:** 
- Controleer of het SQL schema correct is uitgevoerd in Supabase
- Controleer Supabase URL en anon key in Vercel environment variables
