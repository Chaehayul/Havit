import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Heart, LayoutDashboard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi, productApi } from '../../api/product.api';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { cartApi } from '../../api/cart.api';
import { formatPrice, getImageUrl } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { openCart } = useCartStore();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => productApi.getProducts({ search: debouncedSearch, limit: 5 }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  useEffect(() => {
    setMenuOpen(false);
    setActiveCategory(null);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        {/* 상단 공지 배너 */}
        <div className="bg-black text-white text-center text-xs py-2 px-4">
          5만원 이상 구매 시 무료배송 · 당일 오후 2시 이전 주문 당일 출고
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* 모바일 메뉴 버튼 */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMenuOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu size={22} />
            </button>

            {/* 로고 */}
            <Link to="/" className="text-2xl font-bold tracking-widest text-black absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
              HAVIT
            </Link>

            {/* 데스크탑 네비게이션 */}
            <nav className="hidden lg:flex items-center gap-8 ml-12">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="relative group"
                  onMouseEnter={() => setActiveCategory(cat.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="flex items-center gap-0.5 text-sm font-medium text-gray-700 hover:text-black transition-colors py-5"
                  >
                    {cat.name}
                    {cat.children?.length > 0 && <ChevronDown size={14} className="mt-0.5" />}
                  </Link>
                  {cat.children?.length > 0 && (
                    <div className={`absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-lg py-2 transition-all duration-150 ${activeCategory === cat.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/products?category=${sub.slug}`}
                          className="block px-4 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* 우측 아이콘들 */}
            <div className="flex items-center gap-1">
              <button
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="검색"
              >
                <Search size={20} />
              </button>

              {/* 어드민 버튼 — ADMIN 계정일 때만 표시 */}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                >
                  <LayoutDashboard size={14} />
                  관리자
                </Link>
              )}

              {/* 데스크탑에서만 표시 — 모바일은 햄버거 메뉴로 접근 */}
              <Link
                to={user ? '/profile' : '/login'}
                className="hidden lg:flex p-2 hover:bg-gray-50 rounded-full transition-colors"
                aria-label="마이페이지"
              >
                <User size={20} />
              </Link>

              {user && (
                <Link
                  to="/wishlist"
                  className="hidden lg:flex p-2 hover:bg-gray-50 rounded-full transition-colors"
                  aria-label="위시리스트"
                >
                  <Heart size={20} />
                </Link>
              )}

              <button
                className="relative p-2 hover:bg-gray-50 rounded-full transition-colors"
                onClick={openCart}
                aria-label={`장바구니 ${cartCount}개`}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 검색 오버레이 */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white animate-fade-in">
          <div className="max-w-2xl mx-auto px-4 pt-20">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="브랜드, 상품명 검색"
                className="w-full text-2xl border-b-2 border-black pb-3 pr-12 focus:outline-none placeholder:text-gray-300"
              />
              <button type="submit" className="absolute right-0 top-0 p-2">
                <Search size={24} />
              </button>
            </form>

            {/* 자동완성 제안 */}
            {debouncedSearch.length >= 2 && suggestions?.products?.length > 0 && (
              <div className="mt-4 border border-gray-100 shadow-sm divide-y">
                {suggestions.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      navigate(`/products/${product.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-10 h-12 object-cover bg-gray-100 shrink-0"
                      onError={(e) => { e.target.src = 'https://placehold.co/40x48/f3f4f6/9ca3af?text=?'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category?.name} · {formatPrice(product.price)}</p>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 text-left flex items-center gap-2"
                >
                  <Search size={14} />
                  "{searchQuery}" 전체 검색 결과 보기
                </button>
              </div>
            )}
          </div>
          <button
            className="absolute top-6 right-6 p-2"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            aria-label="검색 닫기"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* 모바일 사이드 메뉴 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-xl font-bold">메뉴</span>
              <button onClick={() => setMenuOpen(false)} className="p-2"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              {user ? (
                <div className="px-4 py-3 mb-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name}님</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded"
                      >
                        <LayoutDashboard size={12} />
                        관리자
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Link to="/profile" className="text-xs text-gray-500 underline">마이페이지</Link>
                    <Link to="/wishlist" className="text-xs text-gray-500 underline">위시리스트</Link>
                    <Link to="/orders" className="text-xs text-gray-500 underline">주문내역</Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 px-4 mb-4">
                  <Link to="/login" className="flex-1 btn-primary text-center text-sm py-2">로그인</Link>
                  <Link to="/register" className="flex-1 btn-secondary text-center text-sm py-2">회원가입</Link>
                </div>
              )}
              <nav>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className="block px-4 py-3 font-medium text-gray-800 hover:bg-gray-50"
                    >
                      {cat.name}
                    </Link>
                    {cat.children?.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/products?category=${sub.slug}`}
                        className="block px-8 py-2 text-sm text-gray-500 hover:bg-gray-50"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
