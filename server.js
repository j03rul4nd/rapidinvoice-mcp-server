import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";

// Cargar variables de entorno
dotenv.config();

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Función para logging que no interfiera con MCP
function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('mcp-server.log', `${timestamp}: ${message}\n`);
  } catch (error) {
    // Ignorar errores de logging para no interrumpir MCP
  }
}

// Esquema de validación para generar factura
const GenerateInvoiceSchema = z.object({
  // Datos del cliente
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  clientEmail: z.string().email("Email del cliente inválido"),
  clientAddress: z.string().min(1, "La dirección del cliente es obligatoria"),
  clientCity: z.string().min(1, "La ciudad del cliente es obligatoria"),
  clientPostalCode: z.string().min(1, "El código postal es obligatorio"),
  clientCountry: z.string().min(1, "El país del cliente es obligatorio"),
  
  // Datos de la factura
  invoiceNumber: z.string().optional(),
  date: z.string().optional(), // Si no se proporciona, se usa la fecha actual
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  
  // Items de la factura (array de objetos)
  items: z.array(z.object({
    description: z.string().min(1, "La descripción del item es obligatoria"),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    unitPrice: z.number().min(0.01, "El precio unitario debe ser mayor a 0"),
    taxRate: z.number().min(0, "La tasa de impuesto no puede ser negativa").optional().default(21)
  })).min(1, "Debe haber al menos un item en la factura"),
  
  // Configuración opcional
  currency: z.string().optional().default("EUR"),
  language: z.string().optional().default("es"),
  notes: z.string().optional(),
  
  // Configuración de visibilidad pública
  makePublic: z.boolean().optional().default(true),
  publicExpirationDays: z.number().optional().default(30)
});

class McpRapidInvoiceServer {
  constructor() {
    // Obtener API_KEY desde argumentos del proceso (corresponde al userId)
    this.userApiKey = this.getConfigValue('API_KEY');
    
    if (!this.userApiKey) {
      logToFile("❌ Error: API_KEY es requerida");
      process.exit(1);
    }
    
    this.server = new Server(
      {
        name: "rapidinvoice-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }
  
  getConfigValue(key) {
    // Buscar en argumentos del proceso primero
    const args = process.argv;
    const argIndex = args.findIndex(arg => arg.startsWith(`--${key.toLowerCase()}=`));
    if (argIndex !== -1) {
      return args[argIndex].split('=')[1];
    }
    
    // Buscar en variables de entorno como fallback
    return process.env[key];
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      logToFile(`[MCP Error] ${error}`);
    };

    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      await this.server.close();
      process.exit(0);
    });

    // Cleanup al cerrar
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  setupToolHandlers() {
    // Handler para listar herramientas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "generar_factura",
            description: "Genera una nueva factura en RapidInvoice y devuelve el enlace público para visualizarla",
            inputSchema: {
              type: "object",
              properties: {
                // Datos del cliente
                clientName: {
                  type: "string",
                  description: "Nombre completo del cliente"
                },
                clientEmail: {
                  type: "string",
                  description: "Email del cliente"
                },
                clientAddress: {
                  type: "string", 
                  description: "Dirección del cliente"
                },
                clientCity: {
                  type: "string",
                  description: "Ciudad del cliente"
                },
                clientPostalCode: {
                  type: "string",
                  description: "Código postal del cliente"
                },
                clientCountry: {
                  type: "string",
                  description: "País del cliente"
                },
                
                // Datos de la factura
                invoiceNumber: {
                  type: "string",
                  description: "Número de factura (opcional, se autogenera si no se proporciona)"
                },
                date: {
                  type: "string",
                  description: "Fecha de la factura en formato YYYY-MM-DD (opcional, por defecto hoy)"
                },
                dueDate: {
                  type: "string",
                  description: "Fecha de vencimiento en formato YYYY-MM-DD"
                },
                
                // Items
                items: {
                  type: "array",
                  description: "Lista de productos/servicios en la factura",
                  items: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                        description: "Descripción del producto/servicio"
                      },
                      quantity: {
                        type: "number",
                        description: "Cantidad"
                      },
                      unitPrice: {
                        type: "number", 
                        description: "Precio unitario"
                      },
                      taxRate: {
                        type: "number",
                        description: "Tasa de impuesto en porcentaje (por defecto 21)"
                      }
                    },
                    required: ["description", "quantity", "unitPrice"]
                  }
                },
                
                // Configuración opcional
                currency: {
                  type: "string",
                  description: "Moneda (por defecto EUR)"
                },
                language: {
                  type: "string", 
                  description: "Idioma de la factura (por defecto es)"
                },
                notes: {
                  type: "string",
                  description: "Notas adicionales en la factura"
                },
                makePublic: {
                  type: "boolean",
                  description: "Hacer la factura visible públicamente (por defecto true)"
                },
                publicExpirationDays: {
                  type: "number",
                  description: "Días hasta que expire el enlace público (por defecto 30)"
                }
              },
              required: [
                "clientName", 
                "clientEmail", 
                "clientAddress", 
                "clientCity", 
                "clientPostalCode", 
                "clientCountry", 
                "dueDate", 
                "items"
              ]
            }
          }
        ],
      };
    });

    // Handler para ejecutar herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === "generar_factura") {
          const result = await this.generarFactura(args);
          return {
            content: [
              {
                type: "text",
                text: result
              }
            ]
          };
        } else {
          throw new Error(`Herramienta desconocida: ${name}`);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          throw new Error(`Datos inválidos:\n${errorMessages.join('\n')}`);
        }
        logToFile(`Error en herramienta ${name}: ${error}`);
        throw error;
      }
    });
  }

  async generarFactura(args) {
    // Validar argumentos
    const validatedData = GenerateInvoiceSchema.parse(args);
    
    try {
      // 1. Verificar que el usuario existe y tiene permisos
      const user = await prisma.user.findUnique({
        where: { id: this.userApiKey }
      });
      
      if (!user) {
        throw new Error("❌ API Key inválida: Usuario no encontrado");
      }
      
      logToFile(`✅ Usuario encontrado: ${user.email}`);
      
      // 2. Verificar límites de facturas del usuario
      if (user.currentInvoiceUsage >= user.monthlyInvoiceLimit) {
        throw new Error(`❌ Límite mensual alcanzado: ${user.currentInvoiceUsage}/${user.monthlyInvoiceLimit} facturas`);
      }
      
      // 3. Calcular totales
      let subtotal = 0;
      let totalTax = 0;
      
      const processedItems = validatedData.items.map(item => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = itemSubtotal * (item.taxRate || 0) / 100;
        
        subtotal += itemSubtotal;
        totalTax += itemTax;
        
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 21,
          total: itemSubtotal + itemTax
        };
      });
      
      const total = subtotal + totalTax;
      const avgTaxRate = subtotal > 0 ? (totalTax / subtotal * 100) : 0;
      
      // 4. Generar número de factura si no se proporciona
      const invoiceNumber = validatedData.invoiceNumber || `${user.id.slice(0, 4).toUpperCase()}-${Date.now()}`;
      
      // 5. Generar token público único
      const publicToken = this.generatePublicToken();
      
      // 6. Calcular fecha de expiración pública
      const publicExpiresAt = validatedData.makePublic ? new Date(Date.now() + (validatedData.publicExpirationDays * 24 * 60 * 60 * 1000)) : null;
      
      // 7. Crear factura en la base de datos
      const invoice = await prisma.invoice.create({
        data: {
          userId: this.userApiKey,
          invoiceNumber: invoiceNumber,
          date: validatedData.date || new Date().toISOString().split('T')[0],
          dueDate: validatedData.dueDate,
          companyData: {
            // Aquí podrías obtener los datos de la empresa del usuario
            name: user.name || "Tu Empresa",
            email: user.email
          },
          clientData: {
            name: validatedData.clientName,
            email: validatedData.clientEmail,
            address: validatedData.clientAddress,
            city: validatedData.clientCity,
            postalCode: validatedData.clientPostalCode,
            country: validatedData.clientCountry
          },
          items: processedItems,
          notes: validatedData.notes || "",
          subtotal: subtotal,
          tax: totalTax,
          taxRate: avgTaxRate,
          total: total,
          currency: validatedData.currency,
          language: validatedData.language,
          isPublic: validatedData.makePublic,
          publicExpiresAt: publicExpiresAt,
          publicToken: publicToken
        }
      });
      
      // 8. Actualizar contador de facturas del usuario
      await prisma.user.update({
        where: { id: this.userApiKey },
        data: {
          currentInvoiceUsage: {
            increment: 1
          }
        }
      });
      
      // 9. Construir URL pública
      const publicUrl = `https://www.rapidinvoice.eu/invoice/public/${publicToken}`;
      
      // 10. Construir respuesta formateada
      let resultado = `✅ **Factura generada exitosamente**\n\n`;
      resultado += `📄 **Número de factura:** ${invoiceNumber}\n`;
      resultado += `👤 **Cliente:** ${validatedData.clientName}\n`;
      resultado += `📧 **Email:** ${validatedData.clientEmail}\n`;
      resultado += `📅 **Fecha:** ${invoice.date}\n`;
      resultado += `⏰ **Vencimiento:** ${validatedData.dueDate}\n`;
      resultado += `💰 **Total:** ${total.toFixed(2)} ${validatedData.currency}\n`;
      resultado += `🧾 **Subtotal:** ${subtotal.toFixed(2)} ${validatedData.currency}\n`;
      resultado += `📊 **IVA (${avgTaxRate.toFixed(1)}%):** ${totalTax.toFixed(2)} ${validatedData.currency}\n\n`;
      
      resultado += `📋 **Items facturados:**\n`;
      processedItems.forEach((item, index) => {
        resultado += `${index + 1}. ${item.description}\n`;
        resultado += `   ${item.quantity} × ${item.unitPrice.toFixed(2)} ${validatedData.currency} = ${item.total.toFixed(2)} ${validatedData.currency}\n`;
      });
      
      resultado += `\n🔗 **Enlace público de la factura:**\n${publicUrl}\n\n`;
      
      if (validatedData.makePublic && publicExpiresAt) {
        resultado += `⏱️ **El enlace expira el:** ${publicExpiresAt.toLocaleDateString('es-ES')}\n`;
      }
      
      resultado += `💡 **Comparte este enlace con tu cliente para que pueda ver y descargar la factura.**\n\n`;
      resultado += `📊 **Estado de tu cuenta:** ${user.currentInvoiceUsage + 1}/${user.monthlyInvoiceLimit} facturas usadas este mes`;
      
      logToFile(`✅ Factura creada: ${invoice.id} - ${publicUrl}`);
      
      return resultado;
      
    } catch (error) {
      logToFile(`❌ Error generando factura: ${error}`);
      
      if (error.code === 'P2002') {
        throw new Error("❌ Error: Ya existe una factura con ese número");
      }
      
      throw error;
    }
  }
  
  generatePublicToken() {
    // Generar token único para acceso público
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  async run() {
    try {
      // Verificar conexión a la base de datos
      await prisma.$connect();
      logToFile("🔗 Conexión a Supabase establecida correctamente");
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logToFile(`🚀 Servidor MCP RapidInvoice iniciado exitosamente con API Key: ${this.userApiKey.substring(0, 8)}...`);
    } catch (error) {
      logToFile(`❌ Error conectando a la base de datos: ${error}`);
      process.exit(1);
    }
  }
}

// Inicializar y ejecutar el servidor
const server = new McpRapidInvoiceServer();
server.run().catch((error) => {
  logToFile(`❌ Error fatal al iniciar el servidor: ${error}`);
  process.exit(1);
});