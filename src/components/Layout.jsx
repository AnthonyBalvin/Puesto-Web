import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/productos', icon: Package, label: 'Productos' },
  { path: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/cobranzas', icon: DollarSign, label: 'Cobranzas' },
  { path: '/reportes', icon: FileText, label: 'Reportes' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada correctamente')
      navigate('/login')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 fixed h-screen shadow-xl z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100/50">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300 hover:rotate-6">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            PuestoWeb
          </span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 transform hover:translate-x-1 animate-[slideInLeft_0.3s_ease-out_forwards] opacity-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 hover:text-blue-600 hover:shadow-md'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100/50 bg-gradient-to-t from-gray-50/50 to-transparent">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 rounded-xl transition-all duration-300 font-semibold border border-transparent hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-[1.02] group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-[fadeIn_0.2s_ease-out]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white/95 backdrop-blur-xl flex flex-col shadow-2xl animate-[slideInLeft_0.3s_ease-out]">
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                  PuestoWeb
                </span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-red-50 rounded-xl transition-all duration-300 hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 transform hover:translate-x-1 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-3 border-t border-gray-100/50 bg-gradient-to-t from-gray-50/50 to-transparent">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 w-full text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 rounded-xl transition-all duration-300 font-semibold border border-transparent hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-[1.02]"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 rounded-xl transition-all duration-300 transform hover:scale-110 group"
            >
              <Menu className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block animate-[fadeIn_0.5s_ease-out]">
                <p className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
                  {user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 transform hover:scale-110 transition-all duration-300 hover:rotate-6 cursor-pointer">
                <span className="text-white font-bold text-sm">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 animate-[fadeIn_0.5s_ease-out]">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}