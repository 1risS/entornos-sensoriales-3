#!/bin/bash
# Script para iniciar servidor local para la aplicación de detección de movimiento

echo "🚀 Iniciando servidor para la aplicación Frame Difference..."
echo "📂 Directorio: $(pwd)"

# Verificar si Python está disponible
if command -v python3 &> /dev/null; then
    echo "🐍 Usando Python 3"
    echo "🌐 Servidor disponible en: http://localhost:8080"
    echo "📱 También disponible en tu red local"
    echo "⏹️  Para detener el servidor, presiona Ctrl+C"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "🐍 Usando Python 2"
    echo "🌐 Servidor disponible en: http://localhost:8080"
    echo "📱 También disponible en tu red local"
    echo "⏹️  Para detener el servidor, presiona Ctrl+C"
    echo ""
    python -m SimpleHTTPServer 8080
else
    echo "❌ Error: Python no está instalado"
    echo "   Instala Python o usa otro servidor web"
    exit 1
fi
