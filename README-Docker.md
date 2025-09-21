# 🐳 Docker Setup para RapidInvoice MCP Server

Esta documentación te guía para ejecutar el servidor MCP de RapidInvoice usando Docker.

## 📋 Prerrequisitos

- Docker Desktop instalado
- Docker Compose instalado
- Archivo `.env` configurado con tu DATABASE_URL

## 🚀 Inicio Rápido

### 1. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

### 2. Construir y ejecutar

```bash
# Construir la imagen
docker build -t rapidinvoice-mcp:latest .

# Ejecutar con Docker Compose
docker-compose up -d
```

### 3. Verificar funcionamiento

```bash
# Ver logs del contenedor
docker-compose logs -f rapidinvoice-mcp

# Verificar estado
docker-compose ps
```

## 🛠️ Scripts Útiles

He creado un script helper para facilitar las operaciones:

```bash
# Hacer ejecutable
chmod +x docker-scripts.sh

# Usar el script
./docker-scripts.sh build    # Construir imagen
./docker-scripts.sh run      # Ejecutar contenedor
./docker-scripts.sh logs     # Ver logs
./docker-scripts.sh stop     # Detener
./docker-scripts.sh clean    # Limpiar todo
```

## 📝 Comandos Docker Útiles

### Construcción y Ejecución

```bash
# Construir imagen
docker build -t rapidinvoice-mcp:latest .

# Ejecutar en background
docker-compose up -d

# Ejecutar en foreground (ver logs)
docker-compose up
```

### Gestión de Contenedores

```bash
# Ver contenedores activos
docker ps

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f rapidinvoice-mcp
```

### Debugging

```bash
# Acceder al shell del contenedor
docker-compose exec rapidinvoice-mcp sh

# Ejecutar comandos en el contenedor
docker-compose exec rapidinvoice-mcp node --version
docker-compose exec rapidinvoice-mcp npm list
```

## ⚙️ Configuración

### Variables de Entorno

El contenedor usa estas variables de entorno:

```env
DATABASE_URL=postgresql://...    # URL de tu base de datos Supabase
API_KEY=user_xxxxx              # API Key del usuario
NODE_ENV=production             # Entorno de ejecución
```

### Volúmenes

Los logs se persisten en:
- `./logs:/app/logs` - Directorio de logs
- `./mcp-server.log:/app/mcp-server.log` - Log principal

### Recursos

El contenedor está limitado a:
- CPU: 0.5 cores (máximo), 0.25 cores (reservado)
- RAM: 512MB (máximo), 256MB (reservado)

## 🔧 Desarrollo

### Para desarrollo local:

```bash
# Crear docker-compose.dev.yml para desarrollo
version: '3.8'
services:
  rapidinvoice-mcp:
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

### Ejecutar en modo desarrollo:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📊 Monitoreo

### Health Check

El contenedor incluye un health check que verifica cada 30 segundos:

```bash
# Ver estado de salud
docker-compose ps
```

### Logs

```bash
# Logs en tiempo real
docker-compose logs -f

# Últimas 100 líneas
docker-compose logs --tail=100

# Logs de un servicio específico
docker-compose logs rapidinvoice-mcp
```

## 🔒 Seguridad

- El contenedor ejecuta con usuario no-root (`mcp:nodejs`)
- Usa Alpine Linux (imagen mínima)
- Solo expone los puertos necesarios
- Variables sensibles via `.env`

## 🚫 Solución de Problemas

### Problema: Imagen no construye

```bash
# Limpiar cache de Docker
docker system prune -a

# Construir sin cache
docker build --no-cache -t rapidinvoice-mcp:latest .
```

### Problema: Contenedor no inicia

```bash
# Verificar logs
docker-compose logs rapidinvoice-mcp

# Verificar variables de entorno
docker-compose config
```

### Problema: No conecta a base de datos

1. Verificar `DATABASE_URL` en `.env`
2. Verificar conectividad de red
3. Verificar que Supabase permita conexiones desde Docker

### Problema: Permisos

```bash
# En sistemas Linux/Mac, dar permisos al script
chmod +x docker-scripts.sh

# Si hay problemas con volúmenes
sudo chown -R $(whoami) ./logs
```

## 📚 Comandos de Referencia Rápida

```bash
# Setup inicial
docker build -t rapidinvoice-mcp:latest .
docker-compose up -d

# Operaciones diarias
docker-compose logs -f        # Ver logs
docker-compose restart       # Reiniciar
docker-compose down          # Detener

# Mantenimiento
docker system prune -f       # Limpiar sistema
docker-compose pull          # Actualizar imágenes
```

## 🔗 Links Útiles

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)