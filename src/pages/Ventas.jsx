import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, ShoppingCart, X, Check, User, CreditCard, DollarSign, Minus, Calculator, Receipt, Camera, Barcode } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Tu configuración real de Supabase
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [carrito, setCarrito] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [busquedaVenta, setBusquedaVenta] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNuevaVenta, setShowNuevaVenta] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isScannerLibLoaded, setIsScannerLibLoaded] = useState(false);
  const html5QrCode = useRef(null)

  const [formVenta, setFormVenta] = useState({
    tipo_pago: 'pagado', // pagado o pendiente
    monto_recibido: '',
    descuento: 0,
    notas: ''
  })

  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    ticketPromedio: 0
  })

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.async = true;
    script.onload = () => setIsScannerLibLoaded(true);
    document.body.appendChild(script);

    return () => {
      if(document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    cargarDatos()
    return () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        detenerScanner().catch(err => console.error("Failed to stop scanner on unmount", err));
      }
    }
  }, [])

  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    const descuento = parseFloat(formVenta.descuento) || 0
    const total = subtotal - descuento
    return { subtotal, descuento, total }
  }
  
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar productos activos con stock
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .gt('stock_actual', 0)
        .order('nombre');

      if (productosError) {
        console.error('Error al cargar productos:', productosError);
        toast.error('Error al cargar productos');
      } else {
        console.log('Productos cargados:', productosData);
        setProductos(productosData || []);
      }

      // Cargar clientes activos
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (clientesError) {
        console.error('Error al cargar clientes:', clientesError);
        toast.error('Error al cargar clientes');
      } else {
        console.log('Clientes cargados:', clientesData);
        setClientes(clientesData || []);
      }

      // Cargar ventas recientes
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          *,
          clientes (
            nombre,
            apellido
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ventasError) {
        console.error('Error al cargar ventas:', ventasError);
        toast.error('Error al cargar ventas');
      } else {
        console.log('Ventas cargadas:', ventasData);
        setVentas(ventasData || []);

        // Calcular estadísticas
        const hoy = new Date().toISOString().split('T')[0];
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        
        const ventasHoyData = (ventasData || []).filter(v => 
          v.created_at.startsWith(hoy) && v.estado === 'completada'
        );
        const ventasMesData = (ventasData || []).filter(v => 
          v.created_at >= inicioMes && v.estado === 'completada'
        );
        
        const totalHoy = ventasHoyData.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
        const totalMes = ventasMesData.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
        const ticketPromedio = ventasHoyData.length > 0 ? totalHoy / ventasHoyData.length : 0;

        setStats({ 
          ventasHoy: totalHoy, 
          ventasMes: totalMes, 
          ticketPromedio 
        });
      }
    } catch (error) {
      console.error('Error general:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  const buscarPorCodigo = (codigo) => {
    const producto = productos.find(p => p.codigo_barras === codigo)
    if (producto) {
      agregarAlCarrito(producto)
      toast.success(`${producto.nombre} agregado`)
    } else {
      toast.error('Producto no encontrado')
    }
  }

  const iniciarScanner = async () => {
    if (!isScannerLibLoaded) {
      toast.error("La librería del escáner aún no ha cargado.");
      return;
    }
    setShowScanner(true);
    await new Promise(resolve => setTimeout(resolve, 100)); 

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      buscarPorCodigo(decodedText);
      detenerScanner();
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    try {
      if (!html5QrCode.current) {
        html5QrCode.current = new window.Html5Qrcode("qr-reader-ventas");
      }
      await html5QrCode.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => { /* ignore */ }
      );
    } catch (err) {
      console.error("Error al iniciar escáner:", err);
      toast.error("No se pudo acceder a la cámara.");
      setShowScanner(false);
    }
  }

  const detenerScanner = async () => {
    try {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        await html5QrCode.current.stop();
        html5QrCode.current = null;
      }
    } catch (err) {
      console.error("Error al detener el escáner:", err);
    } finally {
      setShowScanner(false);
    }
  }

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.id === producto.id)
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock_actual) {
        toast.error(`Solo hay ${producto.stock_actual} unidades disponibles`)
        return
      }
      setCarrito(carrito.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ))
    } else {
      setCarrito([...carrito, { 
        id: producto.id, 
        nombre: producto.nombre, 
        precio: parseFloat(producto.precio_venta), 
        cantidad: 1, 
        stock_disponible: producto.stock_actual, 
        unidad_medida: producto.unidad_medida 
      }])
    }
  }

  const actualizarCantidad = (id, cantidad) => {
    const item = carrito.find(item => item.id === id);
    if (cantidad > item.stock_disponible) {
      toast.error(`Solo hay ${item.stock_disponible} unidades disponibles`);
      return;
    }
    if (cantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }
    setCarrito(carrito.map(item => 
      item.id === id ? { ...item, cantidad } : item
    ));
  };
  
  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
    toast.success('Producto eliminado')
  }

const procesarVenta = async () => {
  if (carrito.length === 0) {
    toast.error('Agrega productos al carrito');
    return;
  }
  
  const { subtotal, descuento, total } = calcularTotales();
  const montoRecibido = parseFloat(formVenta.monto_recibido) || 0;
  
  // Validaciones según tipo de pago
  if (formVenta.tipo_pago === 'pagado' && montoRecibido < total) {
    toast.error('El monto recibido debe ser mayor o igual al total');
    return;
  }
  
  if (formVenta.tipo_pago === 'pendiente' && !clienteSeleccionado) {
    toast.error('Selecciona un cliente para venta fiada');
    return;
  }

  setProcesando(true);
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Si es pendiente, el monto pendiente es el total
    const montoPendiente = formVenta.tipo_pago === 'pendiente' ? total : 0;
    const montoPagado = formVenta.tipo_pago === 'pagado' ? total : 0;
    
    // Insertar la venta
    const { data: ventaData, error: ventaError } = await supabase
      .from('ventas')
      .insert([{
        cliente_id: clienteSeleccionado?.id || null,
        subtotal,
        descuento,
        total,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,
        tipo_pago: formVenta.tipo_pago,
        estado: 'completada',
        notas: formVenta.notas,
        vendedor_id: user?.id
      }])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Insertar detalle de ventas
    const detalleVentas = carrito.map(item => ({
      venta_id: ventaData.id,
      producto_id: item.id,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad
    }));

    const { error: detalleError } = await supabase
      .from('detalle_ventas')
      .insert(detalleVentas);

    if (detalleError) throw detalleError;

    // ✅ El stock se actualiza automáticamente con el trigger
    // No necesitamos código adicional aquí

    // Mostrar mensaje de éxito con vuelto si aplica
    if (formVenta.tipo_pago === 'pagado' && montoRecibido > total) {
      const vuelto = montoRecibido - total;
      toast.success(
        `✅ Venta ${ventaData.numero_venta} completada\n💵 Vuelto: S/ ${vuelto.toFixed(2)}`, 
        { 
          duration: 8000,
          style: { 
            background: '#10b981', 
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }
      );
    } else if (formVenta.tipo_pago === 'pendiente') {
      toast.success(`📝 Venta ${ventaData.numero_venta} fiada registrada`, { duration: 4000 });
    } else {
      toast.success(`✅ Venta ${ventaData.numero_venta} completada`, { duration: 4000 });
    }

    // Limpiar formulario
    setCarrito([]);
    setClienteSeleccionado(null);
    setFormVenta({ 
      tipo_pago: 'pagado', 
      monto_recibido: '', 
      descuento: 0, 
      notas: '' 
    });

    await cargarDatos();
  } catch (error) {
    console.error('Error al procesar venta:', error);
    toast.error('Error al procesar la venta: ' + error.message);
  } finally {
    setProcesando(false);
  }
}

  const cancelarVenta = () => {
    if (carrito.length > 0 && !window.confirm('¿Deseas cancelar esta venta?')) return
    setCarrito([])
    setClienteSeleccionado(null)
    setFormVenta({ 
      tipo_pago: 'pagado', 
      monto_recibido: '', 
      descuento: 0, 
      notas: '' 
    })
    toast.success('Venta cancelada')
  }

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) || 
    (p.codigo_barras || '').includes(busquedaProducto)
  )

  const ventasFiltradas = ventas.filter(v => 
    (v.numero_venta || '').toLowerCase().includes(busquedaVenta.toLowerCase()) || 
    (v.clientes?.nombre || '').toLowerCase().includes(busquedaVenta.toLowerCase())
  )

  const { subtotal, total } = calcularTotales()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-600 mt-1">Punto de venta y gestión de ventas</p>
        </div>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setShowNuevaVenta(true)} 
            className={`w-full md:w-auto px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${
              showNuevaVenta 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            <ShoppingCart className="w-5 h-5" /> Nueva Venta
          </button>
          <button 
            onClick={() => setShowNuevaVenta(false)} 
            className={`w-full md:w-auto px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${
              !showNuevaVenta 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Receipt className="w-5 h-5" /> Historial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard 
          icon={<DollarSign />} 
          title="Ventas Hoy" 
          value={`S/ ${stats.ventasHoy.toFixed(2)}`} 
          color="green" 
        />
        <StatCard 
          icon={<ShoppingCart />} 
          title="Ventas del Mes" 
          value={`S/ ${stats.ventasMes.toFixed(2)}`} 
          color="blue" 
        />
        <StatCard 
          icon={<Calculator />} 
          title="Ticket Promedio" 
          value={`S/ ${stats.ticketPromedio.toFixed(2)}`} 
          color="purple" 
        />
      </div>

      {showNuevaVenta ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de productos */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
<input 
  type="text" 
  placeholder="🔍 Buscar producto o escanear código de barras..." 
  value={busquedaProducto} 
  onChange={(e) => {
    const valor = e.target.value;
    setBusquedaProducto(valor);
    
    // 🔥 Buscar automáticamente por código de barras cuando tiene 8+ dígitos
    if (valor.length >= 8 && /^\d+$/.test(valor)) { // Solo números
      const producto = productos.find(p => p.codigo_barras === valor);
      if (producto) {
        agregarAlCarrito(producto);
        setBusquedaProducto(''); // Limpiar búsqueda
        toast.success(`✅ ${producto.nombre} agregado`);
      }
    }
  }}
  onKeyPress={(e) => {
    // 🔥 Al presionar Enter, buscar por código
    if (e.key === 'Enter') {
      const producto = productos.find(p => p.codigo_barras === busquedaProducto);
      if (producto) {
        agregarAlCarrito(producto);
        setBusquedaProducto('');
        toast.success(`✅ ${producto.nombre} agregado`);
      } else {
        toast.error('Producto no encontrado');
      }
    }
  }}
  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
  autoFocus 
/>
              </div>
              <button 
                onClick={iniciarScanner} 
                disabled={!isScannerLibLoaded} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                {isScannerLibLoaded ? 'Escanear Código' : 'Cargando Escáner...'}
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
              {productosFiltrados.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron productos</p>
                  {productos.length === 0 && (
                    <p className="text-sm mt-2">No hay productos registrados con stock disponible</p>
                  )}
                </div>
              ) : (
                productosFiltrados.map((producto) => (
                  <button 
                    key={producto.id} 
                    onClick={() => agregarAlCarrito(producto)} 
                    className="bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-3 text-left transition group h-full flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-600 mb-1 text-sm line-clamp-2">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {producto.stock_actual} {producto.unidad_medida || 'un'}
                      </p>
                      {producto.codigo_barras && (
                        <div className="flex items-center gap-1 mt-2">
                          <Barcode className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400 font-mono truncate">
                            {producto.codigo_barras}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      S/ {parseFloat(producto.precio_venta).toFixed(2)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel del carrito */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente
              </label>
              <select 
                value={clienteSeleccionado?.id || ''} 
                onChange={(e) => setClienteSeleccionado(
                  clientes.find(c => c.id === e.target.value) || null
                )} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Cliente General</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido} 
                    {cliente.deuda_total > 0 && ` - Deuda: S/ ${parseFloat(cliente.deuda_total).toFixed(2)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Carrito ({carrito.length})
                </h3>
                {carrito.length > 0 && (
                  <button 
                    onClick={cancelarVenta} 
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {carrito.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                    <p>Tu carrito está vacío</p>
                  </div>
                ) : (
                  carrito.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          S/ {item.precio.toFixed(2)} x {item.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} 
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-semibold w-8 text-center text-sm">
                          {item.cantidad}
                        </span>
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} 
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-blue-600 w-20 text-right">
                        S/ {(item.precio * item.cantidad).toFixed(2)}
                      </p>
                      <button 
                        onClick={() => eliminarDelCarrito(item.id)} 
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {carrito.length > 0 && (
                <div className="p-4 border-t border-gray-100 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Descuento:</span>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          S/
                        </span>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={formVenta.descuento} 
                          onChange={(e) => setFormVenta({ 
                            ...formVenta, 
                            descuento: e.target.value 
                          })} 
                          className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-md text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
                      <span>TOTAL:</span>
                      <span className="text-blue-600">S/ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormVenta({ 
                          ...formVenta, 
                          tipo_pago: 'pagado',
                          monto_recibido: total > 0 ? total.toFixed(2) : ''
                        })}
                        className={`py-3 px-4 border-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          formVenta.tipo_pago === 'pagado'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300 text-gray-700'
                        }`}
                      >
                        <Check className="w-5 h-5" />
                        Pagado
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormVenta({ 
                          ...formVenta, 
                          tipo_pago: 'pendiente',
                          monto_recibido: '0'
                        })}
                        className={`py-3 px-4 border-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          formVenta.tipo_pago === 'pendiente'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 text-gray-700'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        Fiado
                      </button>
                    </div>
                  </div>

                  {formVenta.tipo_pago === 'pagado' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          💵 Monto Recibido
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                            S/
                          </span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={formVenta.monto_recibido} 
                            onChange={(e) => setFormVenta({ 
                              ...formVenta, 
                              monto_recibido: e.target.value 
                            })} 
                            className="w-full pl-10 pr-3 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                            placeholder="0.00"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Calculadora de vuelto */}
                      {formVenta.monto_recibido && parseFloat(formVenta.monto_recibido) >= total && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="bg-green-500 rounded-full p-2">
                                <DollarSign className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-green-900">Vuelto a entregar</p>
                                <p className="text-2xl font-bold text-green-700">
                                  S/ {(parseFloat(formVenta.monto_recibido) - total).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {formVenta.monto_recibido && parseFloat(formVenta.monto_recibido) < total && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700 font-medium text-center">
                            ⚠️ Falta: S/ {(total - parseFloat(formVenta.monto_recibido)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {formVenta.tipo_pago === 'pendiente' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-500 rounded-full p-2 mt-1">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-900 mb-1">
                            Venta Fiada
                          </p>
                          <p className="text-xs text-orange-700">
                            {clienteSeleccionado 
                              ? `Cliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` 
                              : '⚠️ Selecciona un cliente arriba'
                            }
                          </p>
                          <p className="text-sm font-bold text-orange-900 mt-2">
                            Deuda: S/ {total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={procesarVenta} 
                    disabled={procesando || total <= 0} 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {procesando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" /> Completar Venta
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por número de venta o cliente..." 
                value={busquedaVenta} 
                onChange={(e) => setBusquedaVenta(e.target.value)} 
                className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">N° Venta</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Pago</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No hay ventas registradas
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {format(new Date(venta.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-blue-600">
                          {venta.numero_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {venta.clientes 
                          ? `${venta.clientes.nombre} ${venta.clientes.apellido || ''}` 
                          : 'Cliente General'
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-800">
                          S/ {parseFloat(venta.total).toFixed(2)}
                        </p>
                        {venta.monto_pendiente > 0 && (
                          <p className="text-xs text-orange-600">
                            Pendiente: S/ {parseFloat(venta.monto_pendiente).toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PaymentBadge type={venta.tipo_pago} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={venta.estado} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Camera className="w-6 h-6 text-blue-600" /> Escanear Código
              </h3>
              <button onClick={detenerScanner} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div 
              id="qr-reader-ventas" 
              className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
            ></div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Apunta la cámara al código de barras o QR.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon, title, value, color }) => {
  const colors = { 
    green: 'bg-green-100 text-green-600', 
    blue: 'bg-blue-100 text-blue-600', 
    purple: 'bg-purple-100 text-purple-600' 
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const PaymentButton = ({ active, onClick, label }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className={`py-2 px-2 border-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
      active 
        ? 'border-blue-500 bg-blue-50 text-blue-700' 
        : 'border-gray-200 hover:border-blue-300'
    }`}
  >
    {label}
  </button>
)

const PaymentBadge = ({ type }) => {
  const styles = { 
    pagado: 'bg-green-100 text-green-800', 
    pendiente: 'bg-orange-100 text-orange-800'
  }
  const text = { 
    pagado: '✓ Pagado', 
    pendiente: '⏳ Pendiente'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
      {text[type] || type}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const styles = { 
    completada: 'bg-green-100 text-green-800', 
    pendiente: 'bg-yellow-100 text-yellow-800', 
    cancelada: 'bg-red-100 text-red-800' 
  }
  const text = { 
    completada: 'Completada', 
    pendiente: 'Pendiente', 
    cancelada: 'Cancelada' 
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {text[status]}
    </span>
  )
}