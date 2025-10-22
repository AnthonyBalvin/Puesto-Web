import { useState, useEffect } from 'react'
import { X, ShoppingCart, DollarSign, Calendar, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function DetalleDeuda({ cliente, onClose }) {
  const [ventas, setVentas] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActiva, setTabActiva] = useState('ventas') // ventas, pagos

  useEffect(() => {
    cargarDatos()
  }, [cliente])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar ventas pendientes
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          *,
          detalle_ventas(*)
        `)
        .eq('cliente_id', cliente.id)
        .gt('monto_pendiente', 0)
        .order('created_at', { ascending: false })

      if (ventasError) throw ventasError

      // Cargar historial de pagos
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (pagosError) throw pagosError

      setVentas(ventasData || [])
      setPagos(pagosData || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                {cliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {cliente.nombre} {cliente.apellido || ''}
                </h2>
                <p className="text-gray-600">{cliente.telefono || 'Sin teléfono'}</p>
                {cliente.direccion && (
                  <p className="text-sm text-gray-500">{cliente.direccion}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Resumen de deuda */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Deuda Total</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                S/ {parseFloat(cliente.deuda_total).toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Límite de Crédito</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                S/ {parseFloat(cliente.limite_credito).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Disponible: S/ {Math.max(0, parseFloat(cliente.limite_credito) - parseFloat(cliente.deuda_total)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setTabActiva('ventas')}
              className={`flex-1 px-6 py-3 font-medium text-sm ${
                tabActiva === 'ventas'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Ventas Pendientes ({ventas.length})
            </button>
            <button
              onClick={() => setTabActiva('pagos')}
              className={`flex-1 px-6 py-3 font-medium text-sm ${
                tabActiva === 'pagos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Historial de Pagos ({pagos.length})
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Tab de Ventas */}
              {tabActiva === 'ventas' && (
                <div className="space-y-4">
                  {ventas.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay ventas pendientes</p>
                  ) : (
                    ventas.map((venta) => (
                      <div key={venta.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">{venta.numero_venta}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(venta.created_at).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-lg font-bold text-gray-800">
                              S/ {parseFloat(venta.total).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Detalles de productos */}
                        {venta.detalle_ventas && venta.detalle_ventas.length > 0 && (
                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Productos:
                            </p>
                            <div className="space-y-1">
                              {venta.detalle_ventas.map((detalle, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {detalle.cantidad}x {detalle.producto_nombre}
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    S/ {parseFloat(detalle.subtotal).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                          <div>
                            <p className="text-xs text-gray-500">Pagado</p>
                            <p className="font-medium text-green-600">
                              S/ {parseFloat(venta.monto_pagado || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Pendiente</p>
                            <p className="font-bold text-red-600">
                              S/ {parseFloat(venta.monto_pendiente).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab de Pagos */}
              {tabActiva === 'pagos' && (
                <div className="space-y-3">
                  {pagos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay pagos registrados</p>
                  ) : (
                    pagos.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">
                            S/ {parseFloat(pago.monto).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(pago.created_at).toLocaleDateString('es-PE')}
                          </p>
                          {pago.notas && (
                            <p className="text-xs text-gray-500 mt-1">{pago.notas}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                            {pago.metodo_pago || 'efectivo'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}