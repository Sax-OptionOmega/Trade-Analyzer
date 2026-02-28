#!/bin/bash

echo ""
echo " ============================================"
echo "  Trade Analyzer Pro - Avvio Server Locale"
echo " ============================================"
echo ""

# Cerca Python 3
if command -v python3 &>/dev/null; then
    PYTHON=python3
elif command -v python &>/dev/null; then
    PYTHON=python
else
    echo " ERRORE: Python non trovato."
    echo " Installa Python da https://www.python.org/downloads/"
    echo ""
    read -p " Premi INVIO per chiudere..."
    exit 1
fi

echo " Python trovato: $PYTHON"
echo ""
echo " Avvio server su http://localhost:8080"
echo " Il browser si aprira' automaticamente..."
echo ""
echo " Per fermare il server premi CTRL+C"
echo ""

# Vai nella cartella dello script
cd "$(dirname "$0")"

# Apri il browser dopo 1.5 secondi (Mac o Linux)
(
    sleep 1.5
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:8080/trade_analyzer.html"
    else
        xdg-open "http://localhost:8080/trade_analyzer.html" 2>/dev/null || \
        sensible-browser "http://localhost:8080/trade_analyzer.html" 2>/dev/null
    fi
) &

# Avvia il server
$PYTHON -m http.server 8080
