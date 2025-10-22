import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, Search, Eye, CreditCard, MessageCircle, X, AlertCircle, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import DetalleDeuda from '../components/cobranzas/detalleDeuda'
import RegistrarPago from '../components/cobranzas/registrarPago'

export default function Cobranzas() {
  const [deudores, setDeudores] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [ordenar, setOrdenar] = useState('mayor')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const [mostrarPago, setMostrarPago] = useState(false)

  const [estadisticas, setEstadisticas] = useState({
    totalDeudas: 0,
    cantidadDeudores: 0,
    deudaPromedio: 0
  })

  useEffect(() => {
    cargarDeudores()
  }, [])

  const cargarDeudores = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .gt('deuda_total', 0)
        .eq('activo', true)
        .order('deuda_total', { ascending: false })

      if (error) throw error

      setDeudores(data || [])
      calcularEstadisticas(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar deudores')
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = (datos) => {
    const totalDeudas = datos.reduce((sum, c) => sum + parseFloat(c.deuda_total || 0), 0)
    const cantidadDeudores = datos.length
    const deudaPromedio = cantidadDeudores > 0 ? totalDeudas / cantidadDeudores : 0

    setEstadisticas({
      totalDeudas,
      cantidadDeudores,
      deudaPromedio
    })
  }

  const deudoresFiltrados = deudores
    .filter(d => 
      d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (d.apellido && d.apellido.toLowerCase().includes(busqueda.toLowerCase())) ||
      (d.telefono && d.telefono.includes(busqueda))
    )
    .sort((a, b) => {
      if (ordenar === 'mayor') return b.deuda_total - a.deuda_total
      if (ordenar === 'menor') return a.deuda_total - b.deuda_total
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

  const abrirDetalle = (cliente) => {
    setClienteSeleccionado(cliente)
    setMostrarDetalle(true)
  }

  const abrirPago = (cliente) => {
    setClienteSeleccionado(cliente)
    setMostrarPago(true)
  }

  const cerrarModales = () => {
    setMostrarDetalle(false)
    setMostrarPago(false)
    setClienteSeleccionado(null)
    cargarDeudores()
  }

  // 🔥 FUNCIÓN DE WHATSAPP
  const enviarWhatsApp = async (cliente) => {
    try {
      const { data: ventas, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('cliente_id', cliente.id)
        .gt('monto_pendiente', 0)
        .order('created_at', { ascending: false })

      if (error) throw error

      const telefono = cliente.telefono?.replace(/\D/g, '') || ''
      
      if (!telefono) {
        toast.error('Este cliente no tiene teléfono registrado')
        return
      }

      let mensaje = `Hola ${cliente.nombre} 👋\n\n`
      mensaje += `Te recordamos que tienes pendiente:\n\n`
      
      if (ventas && ventas.length > 0) {
        ventas.forEach(venta => {
          const fecha = new Date(venta.created_at).toLocaleDateString('es-PE')
          mensaje += `🛒 Venta ${venta.numero_venta}\n`
          mensaje += `   Fecha: ${fecha}\n`
          mensaje += `   Monto: S/ ${parseFloat(venta.monto_pendiente).toFixed(2)}\n\n`
        })
      }
      
      mensaje += `💰 TOTAL DEUDA: S/ ${parseFloat(cliente.deuda_total).toFixed(2)}\n\n`
      mensaje += `Puedes pasar cuando gustes. ¡Gracias! 😊\n\n`
      mensaje += `- PuestoWeb`
      
      const mensajeEncoded = encodeURIComponent(mensaje)
      const url = `https://api.whatsapp.com/send?phone=51${telefono}&text=${mensajeEncoded}`
      
      window.open(url, '_blank', 'noopener,noreferrer')
      toast.success('Abriendo WhatsApp...')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al preparar mensaje de WhatsApp')
    }
  }

  // 📄 FUNCIÓN PARA DESCARGAR PDF
  const descargarPDF = async (cliente) => {
    try {
      const { data: ventas, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('cliente_id', cliente.id)
        .gt('monto_pendiente', 0)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Crear contenido del PDF en HTML
      let contenido = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Estado de Cuenta - ${cliente.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #2563eb; }
              .info { margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #2563eb; color: white; }
              .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #dc2626; }
              .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏪 PuestoWeb</h1>
              <p>Estado de Cuenta</p>
            </div>
            
            <div class="info">
              <div class="info-row">
                <span class="label">Cliente:</span>
                <span>${cliente.nombre} ${cliente.apellido || ''}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span>${cliente.telefono || 'Sin teléfono'}</span>
              </div>
              <div class="info-row">
                <span class="label">Dirección:</span>
                <span>${cliente.direccion || 'Sin dirección'}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span>${new Date().toLocaleDateString('es-PE')}</span>
              </div>
            </div>

            <h2>Detalle de Deudas Pendientes</h2>
            <table>
              <thead>
                <tr>
                  <th>Nº Venta</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
      `

      ventas.forEach(venta => {
        contenido += `
          <tr>
            <td>${venta.numero_venta}</td>
            <td>${new Date(venta.created_at).toLocaleDateString('es-PE')}</td>
            <td>S/ ${parseFloat(venta.total).toFixed(2)}</td>
            <td>S/ ${parseFloat(venta.monto_pagado || 0).toFixed(2)}</td>
            <td style="color: #dc2626; font-weight: bold;">S/ ${parseFloat(venta.monto_pendiente).toFixed(2)}</td>
          </tr>
        `
      })

      contenido += `
              </tbody>
            </table>

            <div class="total">
              TOTAL DEUDA: S/ ${parseFloat(cliente.deuda_total).toFixed(2)}
            </div>

            <div class="footer">
              <p>Este documento es un estado de cuenta generado automáticamente</p>
              <p>PuestoWeb - Sistema de Gestión de Ventas</p>
            </div>
          </body>
        </html>
      `

      // Crear ventana de impresión
      const ventana = window.open('', '', 'width=800,height=600')
      ventana.document.write(contenido)
      ventana.document.close()
      
      // Esperar a que cargue y abrir diálogo de impresión
      ventana.onload = () => {
        ventana.print()
      }

      toast.success('Generando PDF...')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Cobranzas</h1>
        <p className="text-gray-600 mt-1">Gestiona las deudas pendientes de tus clientes</p>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Deudas</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {estadisticas.totalDeudas.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 mr-1" />
            <span className="text-red-600">Por cobrar</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Clientes con Deuda</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {estadisticas.cantidadDeudores}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">Clientes deudores</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Deuda Promedio</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {estadisticas.deudaPromedio.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">Por cliente</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, apellido o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <select
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="mayor">Mayor deuda primero</option>
              <option value="menor">Menor deuda primero</option>
              <option value="reciente">Más reciente</option>
            </select>
          </div>

          {busqueda && (
            <p className="text-sm text-gray-500 mt-2">
              {deudoresFiltrados.length} cliente(s) encontrado(s)
            </p>
          )}
        </div>

        {/* Tabla de deudores */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deuda Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Límite</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deudoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{busqueda ? 'No se encontraron deudores' : '¡Excelente! No hay deudas pendientes'}</p>
                  </td>
                </tr>
              ) : (
                deudoresFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {cliente.nombre} {cliente.apellido || ''}
                          </p>
                          {cliente.direccion && (
                            <p className="text-sm text-gray-500">{cliente.direccion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cliente.telefono ? (
                        <span className="text-gray-600">{cliente.telefono}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin teléfono</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        S/ {parseFloat(cliente.deuda_total).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-gray-600">S/ {parseFloat(cliente.limite_credito).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Disponible: S/ {Math.max(0, parseFloat(cliente.limite_credito) - parseFloat(cliente.deuda_total)).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirDetalle(cliente)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirPago(cliente)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Registrar pago"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => descargarPDF(cliente)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => enviarWhatsApp(cliente)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Enviar recordatorio WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle */}
      {mostrarDetalle && clienteSeleccionado && (
        <DetalleDeuda
          cliente={clienteSeleccionado}
          onClose={cerrarModales}
        />
      )}

      {/* Modal de registro de pago */}
      {mostrarPago && clienteSeleccionado && (
        <RegistrarPago
          cliente={clienteSeleccionado}
          onClose={cerrarModales}
        />
      )}
    </div>
  )
}