import { useState, useEffect } from 'react'
import { X, DollarSign, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function RegistrarPago({ cliente, onClose }) {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    venta_id: '', // vacío = pago general, con ID = pago a venta específica
    notas: ''
  })

  useEffect(() => {
    cargarVentas()
  }, [cliente])

  const cargarVentas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('cliente_id', cliente.id)
        .gt('monto_pendiente', 0)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVentas(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    if (parseFloat(formData.monto) > parseFloat(cliente.deuda_total)) {
      toast.error('El monto no puede ser mayor a la deuda total')
      return
    }

    try {
      setGuardando(true)
      const montoPago = parseFloat(formData.monto)

      // 1. Registrar el pago
      const { data: pagoData, error: pagoError } = await supabase
        .from('pagos')
        .insert([{
          cliente_id: cliente.id,
          venta_id: formData.venta_id || null,
          monto: montoPago,
          metodo_pago: formData.metodo_pago,
          notas: formData.notas
        }])
        .select()
        .single()

      if (pagoError) throw pagoError

      // 2. Si es pago a venta específica
      if (formData.venta_id) {
        const venta = ventas.find(v => v.id === formData.venta_id)
        if (venta) {
          const nuevoPendiente = Math.max(0, parseFloat(venta.monto_pendiente) - montoPago)
          const nuevoPagado = parseFloat(venta.monto_pagado || 0) + montoPago

          const { error: ventaError } = await supabase
            .from('ventas')
            .update({
              monto_pagado: nuevoPagado,
              monto_pendiente: nuevoPendiente,
              estado: nuevoPendiente === 0 ? 'completada' : 'pendiente'
            })
            .eq('id', formData.venta_id)

          if (ventaError) throw ventaError
        }
      } else {
        // 3. Si es pago general, aplicar a ventas más antiguas
        let montoRestante = montoPago
        const ventasOrdenadas = [...ventas].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        )

        for (const venta of ventasOrdenadas) {
          if (montoRestante <= 0) break

          const pendiente = parseFloat(venta.monto_pendiente)
          const pagoAplicado = Math.min(montoRestante, pendiente)
          const nuevoPendiente = pendiente - pagoAplicado
          const nuevoPagado = parseFloat(venta.monto_pagado || 0) + pagoAplicado

          const { error: ventaError } = await supabase
            .from('ventas')
            .update({
              monto_pagado: nuevoPagado,
              monto_pendiente: nuevoPendiente,
              estado: nuevoPendiente === 0 ? 'completada' : 'pendiente'
            })
            .eq('id', venta.id)

          if (ventaError) throw ventaError
          montoRestante -= pagoAplicado
        }
      }

      // 4. Actualizar deuda del cliente
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({
          deuda_total: Math.max(0, parseFloat(cliente.deuda_total) - montoPago)
        })
        .eq('id', cliente.id)

      if (clienteError) throw clienteError

      toast.success('Pago registrado correctamente')
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al registrar pago')
    } finally {
      setGuardando(false)
    }
  }

  const ventaSeleccionada = ventas.find(v => v.id === formData.venta_id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Registrar Pago</h2>
              <p className="text-gray-600 mt-1">
                {cliente.nombre} {cliente.apellido || ''}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Resumen de deuda */}
          <div className="mt-4 bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Deuda Total Pendiente</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              S/ {parseFloat(cliente.deuda_total).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seleccionar venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aplicar pago a:
            </label>
            <select
              value={formData.venta_id}
              onChange={(e) => setFormData({...formData, venta_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Pago general (se aplica a deudas más antiguas)</option>
              {ventas.map((venta) => (
                <option key={venta.id} value={venta.id}>
                  {venta.numero_venta} - Pendiente: S/ {parseFloat(venta.monto_pendiente).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a Pagar *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0.00"
                max={ventaSeleccionada ? ventaSeleccionada.monto_pendiente : cliente.deuda_total}
              />
            </div>
            
            {/* Botones de monto rápido */}
            <div className="flex gap-2 mt-2">
              {ventaSeleccionada ? (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, monto: ventaSeleccionada.monto_pendiente})}
                  className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition"
                >
                  Pagar todo (S/ {parseFloat(ventaSeleccionada.monto_pendiente).toFixed(2)})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, monto: (cliente.deuda_total / 2).toFixed(2)})}
                    className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition"
                  >
                    Mitad
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, monto: cliente.deuda_total})}
                    className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition"
                  >
                    Todo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['efectivo', 'tarjeta', 'transferencia', 'yape'].map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setFormData({...formData, metodo_pago: metodo})}
                  className={`px-4 py-2 rounded-lg border-2 transition font-medium ${
                    formData.metodo_pago === metodo
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ej: Abono a cuenta, pago parcial, etc."
            />
          </div>

          {/* Resumen del pago */}
          {formData.monto && parseFloat(formData.monto) > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-2">Resumen del pago:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Monto a pagar:</span>
                  <span className="font-semibold text-green-700">S/ {parseFloat(formData.monto).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Deuda actual:</span>
                  <span className="font-semibold text-green-700">S/ {parseFloat(cliente.deuda_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700 font-medium">Deuda después del pago:</span>
                  <span className="font-bold text-green-800">
                    S/ {Math.max(0, parseFloat(cliente.deuda_total) - parseFloat(formData.monto)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !formData.monto || parseFloat(formData.monto) <= 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Registrar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}