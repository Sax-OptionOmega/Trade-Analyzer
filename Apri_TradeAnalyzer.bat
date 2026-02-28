@echo off
title Trade Analyzer Pro
color 0A

echo.
echo  ============================================
echo   Trade Analyzer Pro - Avvio Diretto
echo  ============================================
echo.

REM Cartella temporanea profilo isolato (non tocca il tuo Chrome normale)
set TMPDIR=%TEMP%\TradeAnalyzerChrome

REM Percorso file HTML (stessa cartella del bat)
set HTMLFILE=%~dp0trade_analyzer.html

REM Cerca Chrome nei percorsi standard
set CHROME=
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe
    goto :launch
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
    goto :launch
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
    goto :launch
)

REM Prova Edge come fallback
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set CHROME=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
    goto :launch
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set CHROME=C:\Program Files\Microsoft\Edge\Application\msedge.exe
    goto :launch
)

echo  ERRORE: Chrome o Edge non trovati.
echo  Installa Google Chrome da https://www.google.com/chrome/
echo.
pause
exit /b 1

:launch
echo  Browser: %CHROME%
echo  File:    %HTMLFILE%
echo  Profilo: %TMPDIR%
echo.
echo  Apertura in corso...
echo  (il profilo e' isolato, non tocca il tuo browser normale)
echo.

REM Apri con CORS disabilitato, profilo isolato, niente avvisi inutili
start "" "%CHROME%" ^
    --disable-web-security ^
    --disable-site-isolation-trials ^
    --user-data-dir="%TMPDIR%" ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-extensions ^
    --disable-popup-blocking ^
    "%HTMLFILE%"

timeout /t 2 /nobreak >nul
exit
