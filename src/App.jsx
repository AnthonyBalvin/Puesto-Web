import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'
import Cobranzas from './pages/Cobranzas' 
import Layout from './components/Layout'

function App() {
  const { user, loading, checkUser } = useAuthStore()

  useEffect(() => {
    checkUser()
  }, [checkUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/productos"
          element={user ? <Layout><Productos /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/ventas"
          element={user ? <Layout><Ventas /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/clientes"
          element={user ? <Layout><Clientes /></Layout> : <Navigate to="/login" />}
        />
        {/* ⭐ AGREGAR ESTA RUTA */}
        <Route
          path="/cobranzas"
          element={user ? <Layout><Cobranzas /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/reportes"
          element={user ? <Layout><Reportes /></Layout> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App