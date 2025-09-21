# Usar imagen más básica que puede estar en cache
FROM ubuntu:20.04

# Instalar Node.js manualmente
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs openssl && \
    apt-get clean

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Crear el directorio de logs
RUN mkdir -p /app/logs

# Crear usuario no-root para mayor seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Cambiar permisos del directorio de la aplicación
RUN chown -R mcp:nodejs /app
USER mcp

# Exponer puerto (aunque MCP use stdio, por si necesitas debugging)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Comando por defecto
CMD ["node", "server.js"]