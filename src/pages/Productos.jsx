import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, Package, QrCode, Camera, X, Download, Calculator, Tag, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Html5Qrcode } from 'html5-qrcode'

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showCategorias, setShowCategorias] = useState(false)
  const [showCalculadora, setShowCalculadora] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCode = useRef(null)
  
  const [calc, setCalc] = useState({
    precioTotal: '',
    cantidad: '',
    precioUnitario: 0
  })

  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [editandoCategoria, setEditandoCategoria] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    codigo_barras: '',
    categoria_id: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '',
    descripcion: '',
    unidad_medida: 'unidad'
  })
  const [editando, setEditando] = useState(null)

  const unidadesMedida = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramo (kg)' },
    { value: 'gr', label: 'Gramo (gr)' },
    { value: 'litro', label: 'Litro (L)' },
    { value: 'ml', label: 'Mililitro (ml)' },
    { value: 'paquete', label: 'Paquete' },
    { value: 'caja', label: 'Caja' },
    { value: 'bolsa', label: 'Bolsa' }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    return () => {
      if (html5QrCode.current) {
        html5QrCode.current.stop().catch(err => console.log(err))
      }
    }
  }, [])

  useEffect(() => {
    if (calc.precioTotal && calc.cantidad && calc.cantidad > 0) {
      const unitario = parseFloat(calc.precioTotal) / parseFloat(calc.cantidad)
      setCalc(prev => ({ ...prev, precioUnitario: unitario.toFixed(2) }))
    } else {
      setCalc(prev => ({ ...prev, precioUnitario: 0 }))
    }
  }, [calc.precioTotal, calc.cantidad])

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        supabase.from('productos').select('*, categorias(nombre)').eq('activo', true).order('nombre'),
        supabase.from('categorias').select('*').order('nombre')
      ])

      setProductos(productosRes.data || [])
      setCategorias(categoriasRes.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar productos')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        const { error } = await supabase
          .from('productos')
          .update(formData)
          .eq('id', editando.id)
        
        if (error) throw error
        toast.success('Producto actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([formData])
        
        if (error) throw error
        toast.success('Producto creado correctamente')
      }
      
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar producto')
    }
  }

  const handleEdit = (producto) => {
    setFormData({
      nombre: producto.nombre,
      codigo_barras: producto.codigo_barras || '',
      categoria_id: producto.categoria_id || '',
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      descripcion: producto.descripcion || '',
      unidad_medida: producto.unidad_medida || 'unidad'
    })
    setEditando(producto)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Producto eliminado')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
    setEditando(null)
    setShowCalculadora(false)
    setCalc({ precioTotal: '', cantidad: '', precioUnitario: 0 })
    setFormData({
      nombre: '',
      codigo_barras: '',
      categoria_id: '',
      precio_compra: '',
      precio_venta: '',
      stock_actual: '',
      stock_minimo: '',
      descripcion: '',
      unidad_medida: 'unidad'
    })
  }

  const iniciarScanner = async () => {
    setShowScanner(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      html5QrCode.current = new Html5Qrcode("qr-reader")
      
      await html5QrCode.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          setFormData({ ...formData, codigo_barras: decodedText })
          detenerScanner()
          toast.success('Código escaneado correctamente')
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      )
    } catch (err) {
      console.error("Error al iniciar escáner:", err)
      toast.error("No se pudo acceder a la cámara")
      setShowScanner(false)
    }
  }

  const detenerScanner = () => {
    if (html5QrCode.current) {
      html5QrCode.current.stop().then(() => {
        setShowScanner(false)
      }).catch(err => {
        console.log(err)
        setShowScanner(false)
      })
    }
  }

  const aplicarCalculadora = () => {
    if (calc.precioUnitario > 0) {
      setFormData({
        ...formData,
        precio_compra: calc.precioUnitario,
        stock_actual: calc.cantidad
      })
      setShowCalculadora(false)
      toast.success('Precio unitario calculado')
    }
  }

  const guardarCategoria = async () => {
    if (!nuevaCategoria.trim()) {
      toast.error('Ingresa un nombre para la categoría')
      return
    }

    try {
      if (editandoCategoria) {
        const { error } = await supabase
          .from('categorias')
          .update({ nombre: nuevaCategoria })
          .eq('id', editandoCategoria.id)
        
        if (error) throw error
        toast.success('Categoría actualizada')
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert([{ nombre: nuevaCategoria }])
        
        if (error) throw error
        toast.success('Categoría creada')
      }
      
      setNuevaCategoria('')
      setEditandoCategoria(null)
      cargarDatos()
    } catch (error) {
      toast.error(error.message || 'Error al guardar categoría')
    }
  }

  const eliminarCategoria = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Los productos mantendrán su categoría actual.')) return
    
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Categoría eliminada')
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar categoría')
    }
  }

  const generarQR = (producto) => {
    setSelectedProduct(producto)
    setShowQRGenerator(true)
  }

  const descargarQR = () => {
    const canvas = document.getElementById('qr-canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `qr-${selectedProduct.nombre}.png`
      link.href = url
      link.click()
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras || '').includes(busqueda) ||
    (p.categorias?.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona tu inventario de productos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowCategorias(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm sm:text-base"
          >
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Categorías</span>
          </button>
          <button
            onClick={() => {
              setShowModal(true)
              setEditando(null)
              setFormData({
                nombre: '',
                codigo_barras: '',
                categoria_id: '',
                precio_compra: '',
                precio_venta: '',
                stock_actual: '',
                stock_minimo: '',
                descripcion: '',
                unidad_medida: 'unidad'
              })
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
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
        {busqueda && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {productosFiltrados.length} producto(s) encontrado(s)
          </p>
        )}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{producto.nombre}</p>
                      {producto.descripcion && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{producto.descripcion}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium">
                        {producto.categorias?.nombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {producto.codigo_barras ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-600">{producto.codigo_barras}</span>
                          <button
                            onClick={() => generarQR(producto)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Ver código QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin código</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-800">S/ {parseFloat(producto.precio_venta).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Costo: S/ {parseFloat(producto.precio_compra).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        producto.stock_actual <= producto.stock_minimo
                          ? 'bg-red-100 text-red-800'
                          : producto.stock_actual <= producto.stock_minimo * 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {producto.stock_actual} {producto.unidad_medida || 'un'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Vista Mobile - Cards */}
      <div className="md:hidden space-y-3">
        {productosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">{busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
          </div>
        ) : (
          productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {/* Header de la card */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-base mb-1">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-2">{producto.descripcion}</p>
                  )}
                </div>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                  producto.stock_actual <= producto.stock_minimo
                    ? 'bg-red-100 text-red-800'
                    : producto.stock_actual <= producto.stock_minimo * 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {producto.stock_actual} {producto.unidad_medida || 'un'}
                </span>
              </div>

              {/* Detalles */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium">
                    {producto.categorias?.nombre || 'Sin categoría'}
                  </span>
                </div>

                {producto.codigo_barras && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Código:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-600">{producto.codigo_barras}</span>
                      <button
                        onClick={() => generarQR(producto)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Precio Venta</p>
                    <p className="font-bold text-lg text-gray-800">S/ {parseFloat(producto.precio_venta).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Costo</p>
                    <p className="text-sm text-gray-600">S/ {parseFloat(producto.precio_compra).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(producto)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(producto.id)}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Calculadora de precio unitario */}
              {!showCalculadora ? (
                <button
                  type="button"
                  onClick={() => setShowCalculadora(true)}
                  className="w-full bg-green-50 border-2 border-dashed border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition text-sm sm:text-base"
                >
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Calculadora de precio unitario</span>
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2 text-sm sm:text-base">
                      <Calculator className="w-5 h-5" />
                      Calculadora de Precio Unitario
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCalculadora(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Total Pagado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          value={calc.precioTotal}
                          onChange={(e) => setCalc({...calc, precioTotal: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                          placeholder="56.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad Comprada
                      </label>
                      <input
                        type="number"
                        value={calc.cantidad}
                        onChange={(e) => setCalc({...calc, cantidad: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="12"
                      />
                    </div>
                  </div>

                  {calc.precioUnitario > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-green-300">
                      <p className="text-sm text-gray-600 mb-1">Precio por unidad:</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-700">S/ {calc.precioUnitario}</p>
                      <button
                        type="button"
                        onClick={aplicarCalculadora}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium"
                      >
                        Aplicar al formulario
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ej: Coca Cola 2L, Arroz Costeño 1kg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Medida *</label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {unidadesMedida.map((unidad) => (
                      <option key={unidad.value} value={unidad.value}>{unidad.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras / QR</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          toast.success('✅ Código registrado');
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="Escanea o escribe..."
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={iniciarScanner}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Compra *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.precio_compra}
                      onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Venta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.precio_venta}
                      onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  {formData.precio_compra && formData.precio_venta && (
                    <p className="text-xs text-green-600 mt-1">
                      💰 Ganancia: S/ {(parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)).toFixed(2)} 
                      ({(((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({...formData, stock_actual: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Descripción opcional del producto"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categorías */}
      {showCategorias && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Categorías</h2>
              <button onClick={() => {
                setShowCategorias(false)
                setNuevaCategoria('')
                setEditandoCategoria(null)
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && guardarCategoria()}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={guardarCategoria}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg transition font-medium whitespace-nowrap"
                >
                  {editandoCategoria ? 'Actualizar' : 'Agregar'}
                </button>
                {editandoCategoria && (
                  <button
                    onClick={() => {
                      setNuevaCategoria('')
                      setEditandoCategoria(null)
                    }}
                    className="text-gray-600 hover:text-gray-800 px-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {categorias.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay categorías creadas</p>
                ) : (
                  categorias.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <span className="font-medium text-gray-800">{cat.nombre}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNuevaCategoria(cat.nombre)
                            setEditandoCategoria(cat)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarCategoria(cat.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del escáner QR */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Escanear Código</h3>
              <button onClick={detenerScanner} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div id="qr-reader" className="w-full"></div>
            <p className="text-xs sm:text-sm text-gray-600 text-center mt-4">
              Coloca el código QR o de barras frente a la cámara
            </p>
          </div>
        </div>
      )}

      {/* Modal generador de QR */}
      {showQRGenerator && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Código QR</h3>
              <button onClick={() => setShowQRGenerator(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-gray-800 mb-4">{selectedProduct.nombre}</p>
              <div className="bg-gray-100 p-4 rounded-lg inline-block">
                <canvas id="qr-canvas" className="mx-auto"></canvas>
              </div>
              <p className="font-mono text-sm text-gray-600 mt-4">{selectedProduct.codigo_barras}</p>
              
              <button
                onClick={descargarQR}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-medium"
              >
                <Download className="w-5 h-5" />
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}