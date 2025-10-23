// src/pages/Ayuda.jsx
import { Mail, MessageSquare, FileText, Info } from "lucide-react";

export default function Ayuda() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
        <Info size={24} /> Centro de Ayuda
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Guía rápida */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="text-blue-500" /> Guía rápida de uso
          </h2>
          <ul className="list-disc ml-6 text-gray-600 text-sm space-y-1">
            <li>📦 Agrega tus productos desde el módulo <b>Productos</b>.</li>
            <li>🛒 Registra tus ventas en <b>Ventas</b>.</li>
            <li>👥 Administra tus clientes y sus deudas desde <b>Clientes</b> y <b>Cobranzas</b>.</li>
            <li>📈 Consulta el rendimiento del negocio en <b>Reportes</b>.</li>
          </ul>
        </div>

        {/* Contacto de soporte */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="text-green-500" /> Soporte Técnico
          </h2>
          <p className="text-gray-600 text-sm mb-3">
            Si tienes dudas, problemas o sugerencias, puedes comunicarte con el equipo de soporte:
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://wa.me/51934301716?text=Hola!%20Necesito%20ayuda%20con%20PuestoWeb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-600 hover:underline"
            >
              <MessageSquare size={18} /> WhatsApp Soporte
            </a>
            <a
              href="mailto:soporte@puestoweb.com"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Mail size={18} /> soporte@puestoweb.com
            </a>
          </div>
        </div>

        {/* Documentación */}
        <div className="bg-white shadow-md rounded-2xl p-5 md:col-span-2">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="text-purple-500" /> Documentación y Recursos
          </h2>
          <p className="text-gray-600 text-sm mb-3">
            Accede a los recursos de ayuda para aprender más sobre PuestoWeb:
          </p>
          <ul className="list-disc ml-6 text-gray-600 text-sm space-y-1">
            <li>
              📘 <a href="/manual.pdf" target="_blank" className="text-blue-500 hover:underline">Manual del Usuario (PDF)</a>
            </li>
            <li>
              🎥 <a href="https://youtube.com/tu-canal" target="_blank" className="text-blue-500 hover:underline">Videos Tutoriales</a>
            </li>
            <li>
              🧩 <a href="https://github.com/tuusuario/puestoweb" target="_blank" className="text-blue-500 hover:underline">Repositorio del Proyecto</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
