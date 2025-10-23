import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Phone, MapPin, Mail, ShoppingBag, AlertCircle, X, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalleCliente, setShowDetalleCliente] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [clienteAEliminar, setClienteAEliminar] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [ventasCliente, setVentasCliente] = useState([])
  const [editando, setEditando] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    email: '',
    limite_credito: 0
  })

  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesConDeuda: 0,
    deudaTotal: 0
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      // Calcular estadísticas
      const totalClientes = clientesData?.length || 0
      const clientesConDeuda = clientesData?.filter(c => parseFloat(c.deuda_total) > 0).length || 0
      const deudaTotal = clientesData?.reduce((sum, c) => sum + parseFloat(c.deuda_total || 0), 0) || 0

      setStats({
        totalClientes,
        clientesConDeuda,
        deudaTotal
      })

      setClientes(clientesData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
      setLoading(false)
    }
  }

  const cargarVentasCliente = async (clienteId) => {
    try {
      const { data: ventas } = await supabase
        .from('ventas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })

      setVentasCliente(ventas || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar ventas del cliente')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editando) {
        const { error } = await supabase
          .from('clientes')
          .update(formData)
          .eq('id', editando.id)
        
        if (error) throw error
        toast.success('Cliente actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([formData])
        
        if (error) throw error
        toast.success('Cliente creado correctamente')
      }
      
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar cliente')
    }
  }

  const handleEdit = (cliente) => {
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      email: cliente.email || '',
      limite_credito: cliente.limite_credito || 0
    })
    setEditando(cliente)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const cliente = clientes.find(c => c.id === id)
    
    if (cliente.deuda_total > 0) {
      toast.error('No puedes eliminar un cliente con deuda pendiente')
      return
    }

    setClienteAEliminar(cliente)
    setShowConfirmDelete(true)
  }

  const confirmarEliminacion = async () => {
    if (!clienteAEliminar) return
    
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ activo: false })
        .eq('id', clienteAEliminar.id)
      
      if (error) throw error
      toast.success('Cliente eliminado')
      setShowConfirmDelete(false)
      setClienteAEliminar(null)
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar cliente')
    }
  }

  const verDetalleCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    cargarVentasCliente(cliente.id)
    setShowDetalleCliente(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setEditando(null)
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
      direccion: '',
      email: '',
      limite_credito: 0
    })
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.apellido || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono || '').includes(busqueda)
  )

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona la información de tus clientes</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setEditando(null)
            setFormData({
              nombre: '',
              apellido: '',
              telefono: '',
              direccion: '',
              email: '',
              limite_credito: 0
            })
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalClientes}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Clientes con Deuda</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stats.clientesConDeuda}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Deuda Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {stats.deudaTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, apellido o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          {busqueda && (
            <p className="text-sm text-gray-500 mt-2">
              {clientesFiltrados.length} cliente(s) encontrado(s)
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Límite Crédito</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deuda</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const deuda = parseFloat(cliente.deuda_total || 0)

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          {cliente.direccion && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {cliente.direccion}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {cliente.telefono}
                            </p>
                          )}
                          {cliente.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-800">
                          S/ {parseFloat(cliente.limite_credito || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${
                          deuda > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          S/ {deuda.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => verDetalleCliente(cliente)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver historial"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showConfirmDelete && clienteAEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                ¿Eliminar Cliente?
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                ¿Estás seguro de que deseas eliminar a <strong>{clienteAEliminar.nombre} {clienteAEliminar.apellido}</strong>?
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Esta acción no se puede deshacer.
                </span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmDelete(false)
                    setClienteAEliminar(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg shadow-red-500/30"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="999999999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Av. Principal 123"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Crédito
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.limite_credito}
                      onChange={(e) => setFormData({...formData, limite_credito: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Monto máximo que el cliente puede deber
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editando ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Cliente */}
      {showDetalleCliente && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                </h2>
                <p className="text-gray-600 mt-1">Historial de compras</p>
              </div>
              <button onClick={() => setShowDetalleCliente(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Deuda Actual</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    S/ {parseFloat(clienteSeleccionado.deuda_total || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Límite de Crédito</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    S/ {parseFloat(clienteSeleccionado.limite_credito || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Compras</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {ventasCliente.length}
                  </p>
                </div>
              </div>

              {/* Historial de ventas */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Historial de Compras</h3>
                <div className="space-y-3">
                  {ventasCliente.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      No hay compras registradas
                    </p>
                  ) : (
                    ventasCliente.map((venta) => (
                      <div key={venta.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-mono font-semibold text-blue-600">{venta.numero_venta}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(venta.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {venta.tipo_pago === 'pagado' ? '✓ Pagado' : '📝 Fiado'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">S/ {parseFloat(venta.total).toFixed(2)}</p>
                          {venta.monto_pendiente > 0 && (
                            <p className="text-sm text-red-600">
                              Debe: S/ {parseFloat(venta.monto_pendiente).toFixed(2)}
                            </p>
                          )}
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                            venta.estado === 'completada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {venta.estado}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Nota:</strong> Para gestionar los pagos de las deudas, usa el módulo de <strong>Cobranzas</strong> (próximamente disponible).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}