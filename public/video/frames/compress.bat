@echo off
setlocal enabledelayedexpansion

:: Sicherstellen, dass das Skript im Ordner der Batch-Datei arbeitet
cd /d "%~dp0"

:: Prüfen, ob ffmpeg überhaupt erreichbar ist
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo FEHLER: ffmpeg wurde nicht gefunden. 
    echo Bitte installiere ffmpeg oder lege die ffmpeg.exe in diesen Ordner.
    pause
    exit /b
)

:: Erstelle einen Zielordner, falls er fehlt
if not exist "compressed" mkdir "compressed"

echo Starte Komprimierung in: %cd%

:: Verarbeite alle Bilder
for %%i in (*.png *.jpg) do (
    echo Verarbeite: %%i
    
    :: Konvertierung zu WebP
    :: Wir nutzen hier den vollen Pfad zum Zielordner zur Sicherheit
    ffmpeg -i "%%i" -q:v 75 -preset photo "%~dp0compressed\%%~ni.webp" -hide_banner -loglevel error
    
    if errorlevel 1 (
        echo [!] Fehler bei Datei: %%i
    )
)

echo.
echo Fertig! Deine optimierten WebP-Frames liegen im Ordner "compressed".
pause