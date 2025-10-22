import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  DollarSign, 
  Package, 
  Users,
  ShoppingCart,
  BarChart3,
  PieChart
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart as RechartPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import toast from 'react-hot-toast'

export default function Reportes() {
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('mes') // hoy, semana, mes, año
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    totalGanancias: 0,
    ventasRealizadas: 0,
    ticketPromedio: 0
  })

  const [ventasPorDia, setVentasPorDia] = useState([])
  const [productosTop, setProductosTop] = useState([])
  const [ventasPorCategoria, setVentasPorCategoria] = useState([])
  const [metodosPago, setMetodosPago] = useState([])

  useEffect(() => {
    cargarReportes()
  }, [filtroFecha, fechaInicio, fechaFin])

  const obtenerRangoFechas = () => {
    const hoy = new Date()
    let inicio = new Date()

    switch(filtroFecha) {
      case 'hoy':
        inicio = new Date(hoy.setHours(0, 0, 0, 0))
        break
      case 'semana':
        inicio = new Date(hoy.setDate(hoy.getDate() - 7))
        break
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        break
      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        break
      case 'personalizado':
        if (fechaInicio && fechaFin) {
          return { inicio: new Date(fechaInicio), fin: new Date(fechaFin) }
        }
        return null
      default:
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    }

    return { inicio, fin: new Date() }
  }

  const cargarReportes = async () => {
    try {
      setLoading(true)
      const rango = obtenerRangoFechas()
      if (!rango) return

      // 1. Ventas del período
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          *,
          detalle_ventas(*, productos(*))
        `)
        .gte('created_at', rango.inicio.toISOString())
        .lte('created_at', rango.fin.toISOString())
        .eq('estado', 'completada')

      if (ventasError) throw ventasError

      // 2. Calcular estadísticas
      const totalVentas = ventas?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0
      const ventasRealizadas = ventas?.length || 0
      const ticketPromedio = ventasRealizadas > 0 ? totalVentas / ventasRealizadas : 0

      // Calcular ganancias (considerando costo)
      let totalGanancias = 0
      ventas?.forEach(venta => {
        venta.detalle_ventas?.forEach(detalle => {
          const ganancia = (parseFloat(detalle.precio_unitario) - parseFloat(detalle.productos?.precio_compra || 0)) * detalle.cantidad
          totalGanancias += ganancia
        })
      })

      setEstadisticas({
        totalVentas,
        totalGanancias,
        ventasRealizadas,
        ticketPromedio
      })

      // 3. Ventas por día
      const ventasPorDiaMap = {}
      ventas?.forEach(venta => {
        const fecha = new Date(venta.created_at).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: 'short' 
        })
        ventasPorDiaMap[fecha] = (ventasPorDiaMap[fecha] || 0) + parseFloat(venta.total)
      })
      
      const ventasDia = Object.keys(ventasPorDiaMap).map(fecha => ({
        fecha,
        ventas: ventasPorDiaMap[fecha]
      }))
      setVentasPorDia(ventasDia)

      // 4. Productos más vendidos
      const productosMap = {}
      ventas?.forEach(venta => {
        venta.detalle_ventas?.forEach(detalle => {
          const nombre = detalle.producto_nombre
          if (!productosMap[nombre]) {
            productosMap[nombre] = { nombre, cantidad: 0, total: 0 }
          }
          productosMap[nombre].cantidad += detalle.cantidad
          productosMap[nombre].total += parseFloat(detalle.subtotal)
        })
      })

      const topProductos = Object.values(productosMap)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10)
      setProductosTop(topProductos)

      // 5. Métodos de pago
      const metodosMap = {}
      ventas?.forEach(venta => {
        const metodo = venta.tipo_pago || 'efectivo'
        metodosMap[metodo] = (metodosMap[metodo] || 0) + parseFloat(venta.total)
      })

      const metodos = Object.keys(metodosMap).map(metodo => ({
        name: metodo.charAt(0).toUpperCase() + metodo.slice(1),
        value: metodosMap[metodo]
      }))
      setMetodosPago(metodos)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    // Crear CSV simple
    let csv = 'Reporte de Ventas\n\n'
    csv += 'Estadísticas Generales\n'
    csv += `Total Ventas,S/ ${estadisticas.totalVentas.toFixed(2)}\n`
    csv += `Total Ganancias,S/ ${estadisticas.totalGanancias.toFixed(2)}\n`
    csv += `Ventas Realizadas,${estadisticas.ventasRealizadas}\n`
    csv += `Ticket Promedio,S/ ${estadisticas.ticketPromedio.toFixed(2)}\n\n`

    csv += 'Productos Más Vendidos\n'
    csv += 'Producto,Cantidad,Total\n'
    productosTop.forEach(p => {
      csv += `${p.nombre},${p.cantidad},S/ ${p.total.toFixed(2)}\n`
    })

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_${filtroFecha}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('Reporte exportado correctamente')
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis detallado de tu negocio</p>
        </div>
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {['hoy', 'semana', 'mes', 'año'].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroFecha(filtro)}
                className={`px-4 py-2 rounded-lg transition ${
                  filtroFecha === filtro
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
              </button>
            ))}
          </div>

          {filtroFecha === 'personalizado' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {estadisticas.totalVentas.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ganancias</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {estadisticas.totalGanancias.toFixed(2)}
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
              <p className="text-sm text-gray-600 font-medium">Ventas Realizadas</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {estadisticas.ventasRealizadas}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {estadisticas.ticketPromedio.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value) => `S/ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartPie>
              <Pie
                data={metodosPago}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metodosPago.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `S/ ${value.toFixed(2)}`} />
            </RechartPie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Productos Más Vendidos</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={productosTop}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad Vendida" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada de productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Detalle de Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Vendido</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productosTop.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay datos de ventas en este período</p>
                  </td>
                </tr>
              ) : (
                productosTop.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{producto.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {producto.cantidad} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-800">S/ {producto.total.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-gray-600">S/ {(producto.total / producto.cantidad).toFixed(2)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}