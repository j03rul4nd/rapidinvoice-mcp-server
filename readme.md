# RapidInvoice MCP Server

🚀 **Servidor MCP para generar facturas profesionales desde Claude Desktop**

Este servidor MCP (Model Context Protocol) permite generar facturas profesionales directamente desde Claude Desktop, integrándose con la plataforma RapidInvoice y almacenándolas en Supabase.

## 🌟 Características

- ✅ **Generación automática de facturas** con cálculo de totales e IVA
- ✅ **Enlaces públicos** para compartir facturas con clientes
- ✅ **Integración completa** con Claude Desktop
- ✅ **Base de datos Supabase** para almacenamiento persistente
- ✅ **Validación robusta** de datos con Zod
- ✅ **Soporte multi-moneda** (EUR por defecto)
- ✅ **Control de límites** de facturación por usuario
- ✅ **Tokens públicos únicos** con fecha de expiración configurable

## 🔑 Obtener User ID

Para usar este servidor MCP necesitas tu **User ID** de RapidInvoice:

1. **Visita:** [www.rapidinvoice.eu](https://www.rapidinvoice.eu)
2. **Inicia sesión** con tu cuenta
3. **Localiza tu User ID** en el panel de usuario
4. **Formato:** `user_` seguido de caracteres alfanuméricos (ej: `user_32kVAR4EMgF4UYPV2oSVcBu4qV0`)
5. **Usa este User ID** como tu `api_key` en la configuración

> ⚠️ **Importante:** Mantén tu User ID seguro, ya que permite generar facturas en tu cuenta.

- **Node.js** >= 18.0.0
- **Claude Desktop** instalado
- **Cuenta de RapidInvoice** con API Key válida
- **Base de datos Supabase** configurada con Prisma

## 📋 Requisitos Previos

## 🚀 Instalación

> 💡 **Nota:** Este servidor puede ejecutarse localmente para desarrollo o desplegarse en Oracle Cloud para producción.
```bash
git clone https://github.com/j03rul4nd/rapidinvoice-mcp-server.git
cd rapidinvoice-mcp-server
```

### 1. Clonar el repositorio
```bash
npm install
```

### 2. Instalar dependencias
1. Ve a [www.rapidinvoice.eu](https://www.rapidinvoice.eu)
2. Inicia sesión en tu cuenta
3. En tu panel de usuario, encontrarás tu **User ID** (formato: `user_xxxxxxxxxxxxxxxxxx`)
4. Copia este User ID para usarlo como API Key

### 4. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://usuario:password@host:5432/database?schema=public"
API_KEY=user_xxxxxxxxxxxxxxxxxx
```

### 5. Configurar Claude Desktop

#### Opción A: Servidor Local (Desarrollo)
Edita el archivo de configuración de Claude Desktop:

**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rapidinvoice-mcp-server": {
      "command": "node",
      "args": [
        "/ruta/completa/al/proyecto/server.js",
        "--api_key=user_xxxxxxxxxxxxxxxxxx"
      ],
      "cwd": "/ruta/completa/al/proyecto"
    }
  }
}
```

#### Opción B: Servidor en Oracle Cloud (Producción)
```json
{
  "mcpServers": {
    "rapidinvoice-mcp-server": {
      "command": "ssh",
      "args": [
        "usuario@servidor-oracle.com",
        "cd /ruta/del/servidor && node server.js --api_key=user_xxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

### 6. Reiniciar Claude Desktop

## 📖 Uso

Una vez configurado, puedes generar facturas directamente desde Claude Desktop usando prompts como:

```
Genera una factura para:

**Cliente:**
- Nombre: María García López  
- Email: maria.garcia@email.com
- Dirección: Calle Mayor 123, Madrid, 28001, España

**Servicios:**
- Consultoría web: 10 horas × 50€
- Desarrollo landing: 1 × 800€
- Hosting anual: 1 × 120€

**Configuración:**
- Vencimiento: 2025-10-19
- IVA: 21%
- Enlace público: 60 días
```

## 🛠️ Scripts Disponibles

```bash
# Iniciar el servidor
npm start

# Desarrollo con API key
npm run dev

# Testing con inspector MCP
npm test

# Testing con API key
npm run test-with-key
```

## 📊 Estructura del Proyecto

```
rapidinvoice-mcp-server/
├── server.js              # Servidor MCP principal
├── package.json           # Configuración del proyecto
├── .env                   # Variables de entorno (no incluir en git)
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore            # Archivos ignorados por git
├── README.md             # Este archivo
├── prisma/               # Configuración de Prisma
│   └── schema.prisma     # Esquema de base de datos
└── logs/                 # Logs del servidor (generados automáticamente)
    └── mcp-server.log    # Log de operaciones
```

## 🔧 Herramientas Disponibles

### `generar_factura`
Genera una nueva factura y devuelve el enlace público.

**Parámetros obligatorios:**
- `clientName`: Nombre del cliente
- `clientEmail`: Email del cliente  
- `clientAddress`: Dirección del cliente
- `clientCity`: Ciudad del cliente
- `clientPostalCode`: Código postal
- `clientCountry`: País del cliente
- `dueDate`: Fecha de vencimiento (YYYY-MM-DD)
- `items`: Array de productos/servicios

**Parámetros opcionales:**
- `invoiceNumber`: Número de factura personalizado
- `date`: Fecha de emisión (por defecto: hoy)
- `currency`: Moneda (por defecto: EUR)
- `language`: Idioma (por defecto: es)
- `notes`: Notas adicionales
- `makePublic`: Hacer público (por defecto: true)
- `publicExpirationDays`: Días de expiración (por defecto: 30)

## 🔒 Seguridad

- Las API keys se pasan como parámetros de línea de comandos
- Los tokens públicos son únicos y tienen fecha de expiración
- Validación estricta de todos los datos de entrada
- Control de límites de facturación por usuario

## 📝 Logging

Los logs se almacenan en `logs/mcp-server.log` e incluyen:
- Conexiones exitosas a la base de datos
- Facturas generadas con éxito
- Errores y excepciones
- Información de debug

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Joel Benítez Donari**
- Website: [RapidInvoice](https://www.rapidinvoice.eu)
- GitHub: [@j03rul4nd](https://github.com/j03rul4nd)

## 🐛 Reportar Issues

Si encuentras algún bug o tienes una sugerencia, por favor abre un [issue](https://github.com/j03rul4nd/rapidinvoice-mcp-server/issues).

## 🔗 Enlaces Relacionados

- [RapidInvoice](https://www.rapidinvoice.eu) - Plataforma de facturación
- [Model Context Protocol](https://modelcontextprotocol.io/) - Documentación oficial MCP
- [Claude Desktop](https://claude.ai/desktop) - Cliente oficial de Anthropic
- [Prisma](https://prisma.io/) - ORM para base de datos
- [Supabase](https://supabase.com/) - Backend as a Service

---

⭐ **¡No olvides dar una estrella al repo si te resulta útil!**