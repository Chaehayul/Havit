import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/auth.store';

// 일반 페이지
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';

// 어드민 페이지
import AdminDashboard from './pages/admin/Dashboard';
import AdminProductList from './pages/admin/ProductList';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrderList from './pages/admin/OrderList';

function RequireAuth({ children }) {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

// 어드민 레이아웃
function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white shrink-0 relative">
        <div className="p-5 border-b border-gray-700">
          <p className="font-bold text-lg">HAVIT</p>
          <p className="text-xs text-gray-400">관리자 패널</p>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { to: '/admin', label: '대시보드' },
            { to: '/admin/products', label: '상품 관리' },
            { to: '/admin/orders', label: '주문 관리' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="block px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
              {label}
            </Link>
          ))}
          <Link to="/" className="block px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors text-gray-500 hover:text-white mt-4">
            ← 쇼핑몰로 돌아가기
          </Link>
        </nav>
        <div className="absolute bottom-4 left-0 w-56 px-3">
          <button
            onClick={async () => { await logout(); navigate('/'); }}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductList />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrderList />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 어드민 라우트 */}
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      />

      {/* 일반 레이아웃 */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route
          path="/orders"
          element={<RequireAuth><Orders /></RequireAuth>}
        />
        <Route
          path="/profile"
          element={<RequireAuth><Profile /></RequireAuth>}
        />
        <Route
          path="/wishlist"
          element={<RequireAuth><Wishlist /></RequireAuth>}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
