# AGENTS.md – Richtlinien für KI-Agenten

## TypeScript
- Vor jedem Commit MUSS `npx tsc --noEmit` fehlerfrei durchlaufen.
- Niemals direkte Type Assertions (`as string`, `as number`) verwenden, wenn die Typen sich nicht überlappen. Stattdessen `String(value)`, `Number(value)` oder `as unknown as TargetType` nutzen.
- Supabase-Zeilen haben untypisierte Felder (kein generiertes `database.types.ts`). Immer `String(row.field ?? '')` beim Zugriff auf Felder verwenden.

## Build
- `npm run build` muss lokal erfolgreich sein, bevor ein PR erstellt wird.
- TypeScript-Fehler im `scripts/`-Verzeichnis werden beim Vercel-Build genauso geprüft wie App-Code.

## Pre-commit
- Der husky pre-commit Hook läuft `tsc --noEmit`. Er darf nicht umgangen werden (`--no-verify` ist verboten).

## Pull Requests
- Jeder PR muss den Vercel Preview-Build bestehen.
- Keine `@ts-ignore` oder `@ts-expect-error` Kommentare ohne Begründung im Kommentar.

## Architektur
- Das Projekt verwendet **Supabase** als einziges Backend (kein Payload CMS).
- Services (`services/*.ts`) prüfen zuerst `isDev` und geben Mock-Daten zurück. In Produktion nutzen sie `createClient()` aus `@/lib/supabaseServer`.
- Admin-Bereich unter `/admin/*` – geschützt durch `middleware.ts` (Supabase Auth + `profiles.role = 'admin'`).
- Admin-Operationen nutzen `createAdminClient()` aus `@/lib/supabaseAdmin` (Service-Role-Key).
- Umgebungsvariablen werden in `env.mjs` mit Zod validiert. Für `tsc --noEmit` genügt: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Audio-Uploads (TUS Resumable)
- Für **Audio-Dateien (WAVs bis 75 MB)** immer `useTusUpload` Hook aus `@/hooks/useTusUpload` verwenden — NICHT `createSignedUploadUrl`.
- TUS lädt in 6 MB Chunks direkt vom Browser zu Supabase Storage (kein Proxy durch Next.js). Supabase Free Tier unterstützt TUS bis **5 GB pro Datei**.
- `createSignedUploadUrl` bleibt für kleine Files (Bilder, Dokumente unter 50 MB) erhalten.
- Der `chunkSize` für TUS muss **mindestens 6 MB** betragen (Supabase-Anforderung, außer letzter Chunk).
- Datenbankfelder speichern nur den **objectPath** (z. B. `track-id/before-1234.wav`), NICHT die volle URL. Die volle URL wird erst beim Rendern der Public-Page über `createSignedUrl(objectPath, 3600)` generiert.
