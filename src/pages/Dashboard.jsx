import { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    productosTotal: 0,
    clientesTotal: 0,
    stockBajo: 0,
    deudaTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [productosStockBajo, setProductosStockBajo] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

 const cargarDatos = async () => {
  try {
    // Stats generales
    const hoy = new Date().toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    // Ventas de hoy
    const { data: ventasHoy } = await supabase
      .from('ventas')
      .select('total')
      .gte('created_at', hoy)
      .eq('estado', 'completada')

    // Ventas del mes
    const { data: ventasMes } = await supabase
      .from('ventas')
      .select('total')
      .gte('created_at', inicioMes)
      .eq('estado', 'completada')

    // Total productos
    const { count: productosTotal } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)

    // Total clientes
    const { count: clientesTotal } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)

    // Productos con stock bajo - ARREGLADO
    const { data: todosProductos } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
    
    const stockBajo = todosProductos?.filter(p => p.stock_actual <= p.stock_minimo) || []

    // Deuda total
    const { data: clientes } = await supabase
      .from('clientes')
      .select('deuda_total')

    const deudaTotal = clientes?.reduce((sum, c) => sum + (parseFloat(c.deuda_total) || 0), 0) || 0

    // Ventas recientes
    const { data: recientes } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes(nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    setStats({
      ventasHoy: ventasHoy?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0,
      ventasMes: ventasMes?.reduce((sum, v) => sum + parseFloat(v.total), 0) || 0,
      productosTotal: productosTotal || 0,
      clientesTotal: clientesTotal || 0,
      stockBajo: stockBajo?.length || 0,
      deudaTotal
    })

    setVentasRecientes(recientes || [])
    setProductosStockBajo(stockBajo || [])
    setLoading(false)
  } catch (error) {
    console.error('Error cargando datos:', error)
    toast.error('Error al cargar datos del dashboard')
    setLoading(false)
  }
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general de tu tienda</p>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {stats.ventasHoy.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600">Actualizado</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                S/ {stats.ventasMes.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">Mes actual</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Productos</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {stats.productosTotal}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          {stats.stockBajo > 0 && (
            <div className="flex items-center mt-4 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-600 mr-1" />
              <span className="text-orange-600">{stats.stockBajo} con stock bajo</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Clientes</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {stats.clientesTotal}
              </p>
            </div>
            <div className="bg-pink-100 rounded-full p-3">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">Deuda total: S/ {stats.deudaTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Ventas recientes y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas recientes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas Recientes</h3>
          <div className="space-y-3">
            {ventasRecientes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
            ) : (
              ventasRecientes.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">
                      {venta.clientes ? `${venta.clientes.nombre} ${venta.clientes.apellido || ''}` : 'Cliente General'}
                    </p>
                    <p className="text-sm text-gray-500">{venta.numero_venta}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">S/ {parseFloat(venta.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(venta.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productos con stock bajo */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            Alertas de Stock Bajo
          </h3>
          <div className="space-y-3">
            {productosStockBajo.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos con stock bajo</p>
            ) : (
              productosStockBajo.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{producto.nombre}</p>
                    <p className="text-sm text-gray-500">Mínimo: {producto.stock_minimo}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Stock: {producto.stock_actual}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}