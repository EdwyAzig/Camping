# Camping Organizer

Web app collaborativa per organizzare un campeggio in gruppo — liste spesa, pasti, attrezzatura, attività e programma con sync in tempo reale.

## Stack

- **Next.js 16** + TypeScript + Tailwind CSS
- **Supabase** — auth, database PostgreSQL, realtime
- **Leaflet** — mappe OpenStreetMap

## Setup locale

### 1. Supabase

1. Crea un progetto gratuito su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** e incolla il contenuto di [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Esegui la query
4. In **Authentication → Providers**, disattiva "Confirm email" per registrazione istantanea (consigliato per test con amici)
5. Copia **Project URL** e **anon public key** da Settings → API

### 2. Variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Inserisci le credenziali Supabase in `.env.local`.

### 3. Database

Applica tutte le migration SQL su Supabase:

```bash
npm run db:migrate
```

### 4. Avvio

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Netlify

Netlify supporta Next.js 16 nativamente (SSR, middleware, API routes, Server Actions) senza configurazione extra oltre a `netlify.toml`.

### 1. Repository

Push del codice su GitHub, GitLab o Bitbucket.

### 2. Nuovo sito Netlify

1. Vai su [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Collega il repository
3. Netlify rileva automaticamente Next.js; conferma:
   - **Build command:** `npm run build`
   - **Publish directory:** lasciare vuoto (gestito dall'adapter OpenNext)

### 3. Variabili d'ambiente (Netlify → Site configuration → Environment variables)

| Variabile | Obbligatoria | Note |
|-----------|--------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sì | Project URL da Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sì | Chiave anon/public da Supabase |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Solo per mappa Google integrata |

Non impostare `SUPABASE_DB_PASSWORD` su Netlify — le migration si eseguono in locale con `npm run db:migrate`.

### 4. Supabase Auth

In **Authentication → URL Configuration**:

- **Site URL:** `https://tuosito.netlify.app` (o il dominio custom)
- **Redirect URLs:** aggiungi `https://tuosito.netlify.app/**`

### 5. Deploy

Clicca **Deploy site**. Ogni push sul branch principale attiva un nuovo deploy.

Per testare in locale il build di produzione:

```bash
npm run build
npm run start
```

## Come usarla

1. **Registrati** — ogni persona del gruppo crea un account veloce
2. **Crea campeggio** — il primo utente crea il trip (precompilato con "Parco del Gravio")
3. **Invita** — condividi il codice invito o il link `/join/CODICE` con gli altri 3
4. **Organizza** — liste condivise aggiornate in tempo reale

## Sezioni

| Pagina | Funzione |
|--------|----------|
| Dashboard | Mappa, riepilogo, budget |
| Programma | Date flessibili ("domenica dopo le 18") |
| Spesa | Lista cibo/bevande con assegnazioni |
| Pasti | Griglia colazione/pranzo/cena + attrezzatura |
| Attività | Luoghi, costi, partecipanti |
