import { useState, useEffect } from 'react'
import { Package, Plus, Minus, TrendingUp, TrendingDown, Search, Filter, Download, AlertTriangle, Edit3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada')
  
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    motivo: '',
    notas: ''
  })

  const [stats, setStats] = useState({
    totalProductos: 0,
    stockBajo: 0,
    valorInventario: 0,
    movimientosHoy: 0
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Cargar productos
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      // Cargar movimientos recientes
      const { data: movimientosData } = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          productos(nombre, unidad_medida)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // Calcular estadísticas
      const totalProductos = productosData?.length || 0
      const stockBajo = productosData?.filter(p => p.stock_actual <= p.stock_minimo).length || 0
      const valorInventario = productosData?.reduce((sum, p) => 
        sum + (parseFloat(p.precio_compra) * parseFloat(p.stock_actual)), 0
      ) || 0

      const hoy = new Date().toISOString().split('T')[0]
      const movimientosHoy = movimientosData?.filter(m => 
        m.created_at.startsWith(hoy)
      ).length || 0

      setStats({
        totalProductos,
        stockBajo,
        valorInventario,
        movimientosHoy
      })

      setProductos(productosData || [])
      setMovimientos(movimientosData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar inventario')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const producto = productos.find(p => p.id === formData.producto_id)
      if (!producto) {
        toast.error('Selecciona un producto')
        return
      }

      const cantidad = parseFloat(formData.cantidad)
      const stockAnterior = parseFloat(producto.stock_actual)
      let stockNuevo = stockAnterior
      let tipo = tipoMovimiento

      // Calcular nuevo stock según el tipo de movimiento
      if (tipoMovimiento === 'entrada') {
        stockNuevo = stockAnterior + cantidad
      } else if (tipoMovimiento === 'salida') {
        stockNuevo = stockAnterior - cantidad
        if (stockNuevo < 0) {
          toast.error('No hay suficiente stock')
          return
        }
      } else if (tipoMovimiento === 'ajuste') {
        stockNuevo = cantidad
      }

      // Actualizar stock del producto
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock_actual: stockNuevo })
        .eq('id', formData.producto_id)

      if (updateError) throw updateError

      // Registrar movimiento
      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert([{
          producto_id: formData.producto_id,
          tipo: tipo,
          cantidad: cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: formData.motivo,
          notas: formData.notas,
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        }])

      if (movError) throw movError

      toast.success('Movimiento registrado correctamente')
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar movimiento')
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
    setFormData({
      producto_id: '',
      cantidad: '',
      motivo: '',
      notas: ''
    })
    setTipoMovimiento('entrada')
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroTipo === 'todos') return true
    return m.tipo === filtroTipo
  })

  const getTipoColor = (tipo) => {
    switch(tipo) {
      case 'entrada':
        return 'bg-green-100 text-green-800'
      case 'salida':
        return 'bg-red-100 text-red-800'
      case 'ajuste':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'entrada':
        return <TrendingUp className="w-4 h-4" />
      case 'salida':
        return <TrendingDown className="w-4 h-4" />
      case 'ajuste':
        return <Edit3 className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-600 mt-1">Control de stock y movimientos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Registrar Movimiento
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalProductos}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stats.stockBajo}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {stats.valorInventario.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Movimientos Hoy</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stats.movimientosHoy}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Edit3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stock de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Stock de Productos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor en Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => {
                  const valorStock = parseFloat(producto.precio_compra) * parseFloat(producto.stock_actual)
                  const porcentajeStock = (parseFloat(producto.stock_actual) / parseFloat(producto.stock_minimo)) * 100
                  
                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{producto.nombre}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-800">
                          {producto.stock_actual} {producto.unidad_medida || 'un'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {producto.stock_minimo} {producto.unidad_medida || 'un'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        S/ {valorStock.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          parseFloat(producto.stock_actual) <= parseFloat(producto.stock_minimo)
                            ? 'bg-red-100 text-red-800'
                            : parseFloat(producto.stock_actual) <= parseFloat(producto.stock_minimo) * 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {parseFloat(producto.stock_actual) <= parseFloat(producto.stock_minimo)
                            ? '⚠️ Crítico'
                            : parseFloat(producto.stock_actual) <= parseFloat(producto.stock_minimo) * 2
                            ? '⚡ Bajo'
                            : '✓ Normal'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h3>
          <div className="flex gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Anterior</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((movimiento) => (
                  <tr key={movimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(movimiento.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{movimiento.productos?.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(movimiento.tipo)}`}>
                        {getTipoIcon(movimiento.tipo)}
                        {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${
                        movimiento.tipo === 'entrada' ? 'text-green-600' : 
                        movimiento.tipo === 'salida' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {movimiento.tipo === 'entrada' ? '+' : movimiento.tipo === 'salida' ? '-' : ''}
                        {movimiento.cantidad} {movimiento.productos?.unidad_medida || 'un'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {movimiento.stock_anterior}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-800">{movimiento.stock_nuevo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{movimiento.motivo}</p>
                      {movimiento.notas && (
                        <p className="text-xs text-gray-500 mt-1">{movimiento.notas}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nuevo Movimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Registrar Movimiento de Inventario</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Movimiento *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('entrada')}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoMovimiento === 'entrada'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                      tipoMovimiento === 'entrada' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className="font-medium text-sm">Entrada</p>
                    <p className="text-xs text-gray-500">Agregar stock</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('salida')}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoMovimiento === 'salida'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${
                      tipoMovimiento === 'salida' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <p className="font-medium text-sm">Salida</p>
                    <p className="text-xs text-gray-500">Merma/Pérdida</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMovimiento('ajuste')}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoMovimiento === 'ajuste'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Edit3 className={`w-6 h-6 mx-auto mb-2 ${
                      tipoMovimiento === 'ajuste' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className="font-medium text-sm">Ajuste</p>
                    <p className="text-xs text-gray-500">Corregir stock</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                <select
                  required
                  value={formData.producto_id}
                  onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} (Stock actual: {producto.stock_actual} {producto.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoMovimiento === 'ajuste' ? 'Nuevo Stock Total *' : 'Cantidad *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={tipoMovimiento === 'ajuste' ? 'Stock correcto' : 'Cantidad a agregar/quitar'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo *</label>
                <select
                  required
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar motivo</option>
                  {tipoMovimiento === 'entrada' && (
                    <>
                      <option value="compra">Compra de mercadería</option>
                      <option value="devolucion">Devolución de cliente</option>
                      <option value="ajuste_entrada">Ajuste de inventario</option>
                    </>
                  )}
                  {tipoMovimiento === 'salida' && (
                    <>
                      <option value="merma">Merma/Producto vencido</option>
                      <option value="robo">Robo o pérdida</option>
                      <option value="donacion">Donación</option>
                      <option value="consumo">Consumo propio</option>
                      <option value="ajuste_salida">Ajuste de inventario</option>
                    </>
                  )}
                  {tipoMovimiento === 'ajuste' && (
                    <>
                      <option value="ajuste">Corrección de inventario</option>
                      <option value="conteo">Conteo físico</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas (Opcional)</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Detalles adicionales..."
                />
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
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}