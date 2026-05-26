# Administratorhandbuch

Diese Anleitung richtet sich an den **Seiteninhaber** — keine technischen Kenntnisse erforderlich.

---

## Anmeldung

1. Rufe `https://deine-domain.com/admin/login` auf
2. Gib deine Admin-E-Mail-Adresse und dein Passwort ein
3. Du wirst zum **Admin-Dashboard** weitergeleitet

Wenn „Forbidden" angezeigt wird, bitte deinen Entwickler, deinem Konto die Rolle `admin` in der Supabase-Datenbank zuzuweisen.

---

## Dashboard

Das Dashboard (`/admin`) zeigt eine Übersicht aller Inhaltsbereiche. Jede Karte zeigt die Anzahl der aktuellen Einträge in der Datenbank sowie einen Link zur Verwaltung des jeweiligen Bereichs.

---

## Hero & Seitentexte (`/admin/content`)

Bearbeite alle für Besucher sichtbaren Texte der öffentlichen Seite:

- **Hero** — Badge-Text, Hauptüberschriften, Untertitel, Button-Beschriftungen
- **About** — Titel und Fließtext des Über-uns-Bereichs
- **Kontakt** — E-Mail, Telefon, Adresse
- **Social Links** — Instagram-, SoundCloud-, Spotify-URLs
- **Footer** — Tagline

Klicke auf **Alle Änderungen speichern**, wenn du fertig bist.

---

## Showcase-Tracks (`/admin/showcase`)

Showcase-Tracks sind die Vorher/Nachher-Audiovergleiche auf der Startseite.

### Neuen Track hinzufügen

1. Klicke auf **+ New**
2. Fülle die Felder aus:
   - **Title** *(erforderlich)* — Track-Name (z. B. „INCINERATE")
   - **Artist** — Künstlername
   - **Genre** — Musikgenre (optional)
   - **Equipment** — verwendetes Equipment (optional)
   - **Label Before / Label After** — Beschriftung am Player-Toggle (Standard: „Demo" / „Final")
   - **Start Marker (s)** — Wiedergabestartzeit in Sekunden (Standard: 0)
   - **LUFS Target** — Ziellautstärke in LUFS (Standard: -14)
   - **Display Order** — niedrigere Zahlen erscheinen zuerst
   - **Active** — auf **Yes** setzen, um den Track öffentlich sichtbar zu machen
3. Lade die **Before Audio**- und **After Audio**-Dateien hoch
   - Unterstützte Formate: WAV, MP3, FLAC
   - Dateien werden in Cloudflare R2 gespeichert
4. Klicke auf **Create**

### Bearbeiten oder Löschen

Klicke neben einem Track auf **Edit**. Zum Löschen auf **Delete** klicken (eine Bestätigung ist erforderlich).

---

## Galerie (`/admin/gallery`)

Die Galerie zeigt Studio-Fotos auf der öffentlichen Seite.

### Bilder hinzufügen

1. Klicke auf **+ New**
2. Lade ein Bild hoch (JPG oder PNG, max. 100 MB)
3. Füge einen **Alt-Text** hinzu (Beschreibung für Barrierefreiheit)
4. Füge optional eine **Bildunterschrift** hinzu
5. Lege **Display Order** fest und setze **Active**
6. Klicke auf **Save**

> **Tipp:** Bilder werden in Cloudflare R2 (Bucket `sonorativa-media`) gespeichert.

---

## Mitglieder / Team (`/admin/members`)

Verwalte die Teamprofile, die auf der öffentlichen Seite angezeigt werden.

### Teammitglied hinzufügen

1. Klicke auf **+ New**
2. Fülle **Name** *(erforderlich)*, **Role** *(erforderlich)* und **Bio** aus
3. Lade ein **Profilfoto** hoch (quadratische Fotos funktionieren am besten)
4. Füge optional **Social Links** hinzu: Instagram, SoundCloud, Spotify
5. Lege **Display Order** fest und setze **Active**
6. Setze **Featured**:
   - **No** — Mitglied erscheint im Raster
   - **Yes** — Mitglied erscheint als großes Porträt mit Bio oberhalb des Rasters
7. Klicke auf **Create**

---

## Dienstleistungen & Preise (`/admin/services`)

Verwalte die Service-Pakete, die im Services-Modal angezeigt werden.

### Felder

| Feld | Beschreibung |
|---|---|
| Slug | URL-freundliche Kennung (z. B. `mixing`) — muss eindeutig sein |
| Title | Angezeigter Name (z. B. „Mixing") |
| Description / Tagline | Kurze Beschreibung unter dem Titel |
| Price (cents) | Preis in der kleinsten Währungseinheit (z. B. 20000 = 200 €) |
| Currency | `eur`, `usd` etc. |
| Duration | Bearbeitungszeit (z. B. „3–5 Tage") |
| Features | Ein Feature pro Zeile — nur enthaltene Leistungen auflisten |
| Display Order | Niedrigerer Wert = erscheint zuerst |
| Active | Sichtbarkeit ein-/ausschalten |

---

## Bewertungen (`/admin/reviews`)

Verwalte die Kundenbewertungen, die auf der öffentlichen Seite angezeigt werden.

### Bewertung manuell hinzufügen

1. Klicke auf **+ New**
2. Fülle folgende Felder aus:
   - **Client Name** *(erforderlich)*
   - **Rating (1–5)** *(erforderlich)*
   - **Text** *(erforderlich)* — der Bewertungstext
   - **Service** — Mix, Master, Mix & Master oder Producing
   - **Date** — Datum der Bewertung
   - **Project Link** — optionale URL zum Projekt
3. Klicke auf **Create**

> **Hinweis:** Bewertungen müssen manuell aktiviert werden — setze im Bearbeiten-Formular **Active** auf **Yes**, damit sie öffentlich erscheinen.

---

## Credits (`/admin/credits`)

Credits sind die Diskografie bzw. Kundenliste, die auf der Seite angezeigt wird.

### Credit hinzufügen

1. Klicke auf **+ New**
2. Fülle **Name** *(erforderlich)* (Künstler oder Band) aus
3. Wähle **Role** *(erforderlich)*: Mix, Master, Mix & Master oder Producing
4. Füge optional ein **Jahr** hinzu
5. Füge optional eine **Spotify-URL** hinzu und lade ein **Cover-Bild** hoch
6. Setze **Featured**, um den Credit hervorzuheben
7. Klicke auf **Create**

---

## Rechtliche Seiten (`/admin/legal`)

Bearbeite Impressum und Datenschutzerklärung.

1. Klicke auf die Seite, die du bearbeiten möchtest
2. Bearbeite den HTML-Inhalt direkt im Textfeld
3. Klicke auf **Save**

---

## Medienbrowser (`/admin/media`)

Durchsuche alle in Cloudflare R2 gespeicherten Dateien. Es werden zwei Buckets angezeigt:

- **sonorativa-media** — Bilder (Galerie, Mitgliederfotos, Credit-Cover)
- **sonorativa-audio** — Audiodateien (Showcase-Vor-/Nachher-Tracks)

Nutze diese Seite, um Uploads zu überprüfen und Speicherpfade zu kopieren.

---

## Tipps

- Änderungen sind **sofort live** nach dem Speichern — kein Cache muss geleert werden.
- Wenn ein Bereich noch „Demo-Inhalt" anzeigt, nachdem du einen Eintrag hinzugefügt hast, stelle sicher, dass der neue Eintrag als **Active** markiert ist.
- Um Demo-Inhalte für einen Bereich wiederherzustellen, lösche alle Einträge in diesem Bereich über das Admin-Panel.
