import { Mail, MessageSquare, FileText, Info, HelpCircle, BookOpen, Shield, Zap, Package, ShoppingCart, Users, DollarSign, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function Ayuda() {
  const [faqAbierto, setFaqAbierto] = useState(null);

  const toggleFaq = (index) => {
    setFaqAbierto(faqAbierto === index ? null : index);
  };

  const generarManualUsuario = () => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Manual del Usuario - PuestoWeb</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          h3 { color: #374151; margin-top: 20px; }
          .modulo { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
          ul { margin-left: 20px; }
          li { margin: 10px 0; }
          .importante { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>📘 Manual del Usuario - PuestoWeb</h1>
        <p><strong>Sistema de Punto de Venta</strong></p>
        <p>Fecha: ${new Date().toLocaleDateString('es-PE')}</p>

        <h2>1. Introducción</h2>
        <p>PuestoWeb es un sistema completo de punto de venta diseñado para pequeños negocios y tiendas. Permite gestionar productos, ventas, clientes, cobranzas y generar reportes de manera simple y eficiente.</p>

        <h2>2. Módulo de Productos</h2>
        <div class="modulo">
          <h3>Funcionalidades principales:</h3>
          <ul>
            <li><strong>Crear productos:</strong> Registra nuevos productos con código de barras, precio de compra, precio de venta, stock y categoría.</li>
            <li><strong>Escáner de códigos:</strong> Usa la cámara para escanear códigos de barras o QR automáticamente.</li>
            <li><strong>Calculadora de precios:</strong> Calcula el precio unitario dividiendo el precio total entre la cantidad comprada.</li>
            <li><strong>Gestión de categorías:</strong> Organiza tus productos por categorías personalizadas.</li>
            <li><strong>Alertas de stock:</strong> Recibe notificaciones cuando el stock esté bajo el mínimo establecido.</li>
          </ul>
        </div>

        <h2>3. Módulo de Ventas</h2>
        <div class="modulo">
          <h3>Proceso de venta:</h3>
          <ul>
            <li><strong>Búsqueda de productos:</strong> Busca manualmente o escanea códigos de barras.</li>
            <li><strong>Carrito de compras:</strong> Agrega productos, modifica cantidades y aplica descuentos.</li>
            <li><strong>Tipos de pago:</strong> Registra ventas al contado (pagado) o fiadas (pendiente).</li>
            <li><strong>Cálculo automático:</strong> El sistema calcula subtotales, descuentos y vuelto automáticamente.</li>
            <li><strong>Actualización de inventario:</strong> El stock se actualiza automáticamente al procesar la venta.</li>
          </ul>
        </div>

        <h2>4. Soporte Técnico</h2>
        <p><strong>WhatsApp:</strong> +51 934 301 716</p>
        <p><strong>Email:</strong> soporte@puestoweb.com</p>
      </body>
      </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarTerminos = () => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Términos y Condiciones - PuestoWeb</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 25px; }
          p { margin: 10px 0; text-align: justify; }
          .fecha { color: #6b7280; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>📜 Términos y Condiciones de Uso</h1>
        <p class="fecha">Última actualización: ${new Date().toLocaleDateString('es-PE')}</p>

        <h2>1. Aceptación de los Términos</h2>
        <p>Al acceder y utilizar PuestoWeb, usted acepta estar sujeto a estos términos y condiciones de uso.</p>

        <h2>2. Descripción del Servicio</h2>
        <p>PuestoWeb es un sistema de punto de venta en línea que permite a los usuarios gestionar productos, ventas, clientes y generar reportes.</p>

        <h2>3. Contacto</h2>
        <p><strong>Email:</strong> soporte@puestoweb.com</p>
        <p><strong>WhatsApp:</strong> +51 934 301 716</p>
      </body>
      </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarGuiaRapida = () => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Guía de Inicio Rápido - PuestoWeb</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
          h2 { color: #059669; margin-top: 25px; }
          .paso { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>🚀 Guía de Inicio Rápido</h1>
        <p>¡Bienvenido a PuestoWeb! Sigue estos pasos para empezar.</p>

        <div class="paso">
          <h3>1. Registra tus Productos</h3>
          <p>Ve al módulo Productos y agrega tu inventario inicial.</p>
        </div>

        <div class="paso">
          <h3>2. Agrega tus Clientes</h3>
          <p>Registra tus clientes frecuentes para ventas fiadas.</p>
        </div>

        <h2>¿Necesitas Ayuda?</h2>
        <p><strong>WhatsApp:</strong> +51 934 301 716</p>
        <p><strong>Email:</strong> soporte@puestoweb.com</p>
      </body>
      </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarPoliticaPrivacidad = () => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Política de Privacidad - PuestoWeb</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
          h2 { color: #6d28d9; margin-top: 25px; }
          p { margin: 10px 0; text-align: justify; }
        </style>
      </head>
      <body>
        <h1>🔒 Política de Privacidad</h1>
        <p>Última actualización: ${new Date().toLocaleDateString('es-PE')}</p>

        <h2>1. Información que Recopilamos</h2>
        <p>Recopilamos información de cuenta, datos del negocio y datos de uso.</p>

        <h2>2. Seguridad de Datos</h2>
        <p>Utilizamos medidas de seguridad de nivel empresarial para proteger sus datos.</p>

        <h2>3. Contacto</h2>
        <p><strong>Email:</strong> soporte@puestoweb.com</p>
        <p><strong>WhatsApp:</strong> +51 934 301 716</p>
      </body>
      </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const faqs = [
    {
      pregunta: "¿Cómo registro mi primer producto?",
      respuesta: "Ve al módulo de Productos, haz clic en 'Nuevo Producto', completa los campos requeridos (nombre, precio de compra, precio de venta, stock actual y stock mínimo). Opcionalmente puedes escanear el código de barras con la cámara y asignar una categoría."
    },
    {
      pregunta: "¿Cómo realizo una venta al contado?",
      respuesta: "En el módulo Ventas, busca los productos (manual o escaneando), agrégalos al carrito, selecciona 'Pagado' como tipo de pago, ingresa el monto recibido y confirma la venta. El sistema calculará automáticamente el vuelto y actualizará el inventario."
    },
    {
      pregunta: "¿Cómo registro una venta fiada?",
      respuesta: "En Ventas, agrega productos al carrito, selecciona un cliente específico (obligatorio para ventas fiadas), elige 'Fiado' como tipo de pago y confirma. La deuda se registrará automáticamente en el cliente y podrás gestionarla desde el módulo de Cobranzas."
    },
    {
      pregunta: "¿Cómo gestiono los pagos de deudas?",
      respuesta: "Ve al módulo de Cobranzas, busca al cliente deudor, haz clic en 'Registrar Pago', ingresa el monto y selecciona si deseas aplicarlo a ventas específicas o como pago general. El sistema actualizará automáticamente la deuda del cliente."
    },
    {
      pregunta: "¿Qué hago si el stock está en negativo?",
      respuesta: "Si un producto muestra stock negativo, edítalo desde el módulo Productos y corrige el stock actual. También puedes usar la calculadora de precio unitario al recibir nueva mercancía para actualizar precio y stock simultáneamente."
    },
    {
      pregunta: "¿Cómo envío recordatorios de pago por WhatsApp?",
      respuesta: "En el módulo de Cobranzas, haz clic en el botón de WhatsApp junto al cliente. Se generará automáticamente un mensaje con el detalle de su deuda que podrás enviar directamente desde WhatsApp Web."
    },
    {
      pregunta: "¿Puedo eliminar un cliente o producto?",
      respuesta: "Sí, pero la eliminación es lógica (no se borran físicamente). Los clientes con deuda pendiente no pueden eliminarse. Los productos y clientes eliminados permanecen en el historial de ventas para mantener la integridad de los datos."
    },
    {
      pregunta: "¿Cómo genero reportes de ventas?",
      respuesta: "Ve al módulo de Reportes, selecciona el rango de fechas que deseas analizar (hoy, semana, mes o personalizado) y visualiza gráficos de ventas, métodos de pago y productos más vendidos. También puedes exportar los datos a CSV."
    }
  ];

  const modulos = [
    {
      icon: Package,
      titulo: "Productos",
      color: "blue",
      descripcion: "Gestiona tu inventario, códigos de barras, categorías y alertas de stock bajo. Usa el escáner para agregar productos rápidamente."
    },
    {
      icon: ShoppingCart,
      titulo: "Ventas",
      color: "green",
      descripcion: "Punto de venta completo con búsqueda rápida, escáner, descuentos y cálculo automático de vuelto. Soporta ventas al contado y fiadas."
    },
    {
      icon: Users,
      titulo: "Clientes",
      color: "purple",
      descripcion: "Administra tu cartera de clientes, límites de crédito, información de contacto e historial de compras de cada uno."
    },
    {
      icon: DollarSign,
      titulo: "Cobranzas",
      color: "orange",
      descripcion: "Controla las deudas pendientes, registra pagos parciales o totales y envía recordatorios automáticos por WhatsApp."
    },
    {
      icon: BarChart3,
      titulo: "Reportes",
      color: "red",
      descripcion: "Visualiza el rendimiento de tu negocio con gráficos interactivos, estadísticas de ventas y análisis de productos más vendidos."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Centro de Ayuda</h1>
          <p className="text-gray-600 mt-1">Todo lo que necesitas saber sobre PuestoWeb</p>
        </div>
      </div>

      {/* Guía rápida por módulos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Guía Rápida de Inicio
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modulos.map((modulo, index) => {
            const Icon = modulo.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className={`bg-${modulo.color}-100 p-2.5 rounded-lg flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${modulo.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1">{modulo.titulo}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{modulo.descripcion}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preguntas Frecuentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Preguntas Frecuentes
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-800 text-left">{faq.pregunta}</span>
                {faqAbierto === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                )}
              </button>
              {faqAbierto === index && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contacto de soporte */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-600" />
          Soporte Técnico
        </h2>
        <p className="text-gray-700 mb-4">
          ¿Necesitas ayuda personalizada? Nuestro equipo está disponible para resolver tus dudas, problemas técnicos o escuchar tus sugerencias.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/51934301716?text=Hola!%20Necesito%20ayuda%20con%20PuestoWeb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-green-500/30"
          >
            <MessageSquare className="w-5 h-5" />
            WhatsApp Soporte
          </a>
          <a
            href="mailto:soporte@puestoweb.com"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30"
          >
            <Mail className="w-5 h-5" />
            soporte@puestoweb.com
          </a>
        </div>
      </div>

      {/* Documentación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          Documentación y Recursos
        </h2>
        <p className="text-gray-600 mb-4">
          Consulta nuestra documentación oficial para aprovechar al máximo todas las funcionalidades de PuestoWeb:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => generarManualUsuario()}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Manual del Usuario</h3>
              <p className="text-sm text-gray-600">Guía completa en PDF</p>
            </div>
          </button>

          <button
            onClick={() => generarTerminos()}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="bg-gray-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Términos y Condiciones</h3>
              <p className="text-sm text-gray-600">Condiciones de uso</p>
            </div>
          </button>

          <button
            onClick={() => generarGuiaRapida()}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="bg-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Guía de Inicio Rápido</h3>
              <p className="text-sm text-gray-600">Primeros pasos</p>
            </div>
          </button>

          <button
            onClick={() => generarPoliticaPrivacidad()}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="bg-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Política de Privacidad</h3>
              <p className="text-sm text-gray-600">Protección de datos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}