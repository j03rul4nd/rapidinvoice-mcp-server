#!/bin/bash

# Scripts útiles para Docker

# Función para mostrar ayuda
show_help() {
    echo "🐳 Scripts de Docker para RapidInvoice MCP Server"
    echo ""
    echo "Uso: ./docker-scripts.sh [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  build     - Construir la imagen Docker"
    echo "  run       - Ejecutar el contenedor"
    echo "  stop      - Detener el contenedor"
    echo "  restart   - Reiniciar el contenedor"
    echo "  logs      - Ver logs del contenedor"
    echo "  shell     - Abrir shell en el contenedor"
    echo "  clean     - Limpiar contenedores e imágenes"
    echo "  dev       - Ejecutar en modo desarrollo"
    echo "  prod      - Ejecutar en modo producción"
    echo "  help      - Mostrar esta ayuda"
    echo ""
}

# Construir imagen
build() {
    echo "🔨 Construyendo imagen Docker..."
    docker build -t rapidinvoice-mcp:latest .
    echo "✅ Imagen construida exitosamente"
}

# Ejecutar contenedor
run() {
    echo "🚀 Iniciando contenedor..."
    docker-compose up -d
    echo "✅ Contenedor iniciado"
    echo "📋 Para ver logs: ./docker-scripts.sh logs"
}

# Detener contenedor
stop() {
    echo "⏹️  Deteniendo contenedor..."
    docker-compose down
    echo "✅ Contenedor detenido"
}

# Reiniciar contenedor
restart() {
    echo "🔄 Reiniciando contenedor..."
    docker-compose restart
    echo "✅ Contenedor reiniciado"
}

# Ver logs
logs() {
    echo "📋 Mostrando logs del contenedor..."
    docker-compose logs -f rapidinvoice-mcp
}

# Abrir shell
shell() {
    echo "🐚 Abriendo shell en el contenedor..."
    docker-compose exec rapidinvoice-mcp sh
}

# Limpiar
clean() {
    echo "🧹 Limpiando contenedores e imágenes..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker system prune -f
    echo "✅ Limpieza completada"
}

# Modo desarrollo
dev() {
    echo "🛠️  Iniciando en modo desarrollo..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
}

# Modo producción
prod() {
    echo "🏭 Iniciando en modo producción..."
    docker-compose -f docker-compose.yml up -d
    echo "✅ Servidor iniciado en producción"
}

# Verificar que Docker esté instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker no está instalado"
        echo "   Instala Docker desde: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose no está instalado"
        echo "   Instala Docker Compose desde: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# Función principal
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            build
            ;;
        run)
            run
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        shell)
            shell
            ;;
        clean)
            clean
            ;;
        dev)
            dev
            ;;
        prod)
            prod
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"