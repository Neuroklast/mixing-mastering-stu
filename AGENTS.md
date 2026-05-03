# AGENTS.md – Richtlinien für KI-Agenten

## TypeScript
- Vor jedem Commit MUSS `npx tsc --noEmit` fehlerfrei durchlaufen.
- Niemals direkte Type Assertions (`as string`, `as number`) verwenden, wenn die Typen sich nicht überlappen. Stattdessen `String(value)`, `Number(value)` oder `as unknown as TargetType` nutzen.
- Payload CMS IDs können `number` oder `string` sein (je nach DB-Adapter). Immer `String(id)` verwenden.

## Build
- `npm run build` muss lokal erfolgreich sein, bevor ein PR erstellt wird.
- TypeScript-Fehler im `scripts/`-Verzeichnis werden beim Vercel-Build genauso geprüft wie App-Code.

## Pre-commit
- Der husky pre-commit Hook läuft `tsc --noEmit`. Er darf nicht umgangen werden (`--no-verify` ist verboten).

## Pull Requests
- Jeder PR muss den Vercel Preview-Build bestehen.
- Keine `@ts-ignore` oder `@ts-expect-error` Kommentare ohne Begründung im Kommentar.
