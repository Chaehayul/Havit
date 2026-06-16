import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { productApi, categoryApi } from '../api/product.api';
import ProductGrid from '../components/product/ProductGrid';
import { CategoryIcon } from '../components/common/CategoryIcons';
import RecentlyViewed from '../components/product/RecentlyViewed';

export default function Home() {
  const { data: newArrivalsData } = useQuery({
    queryKey: ['products', { featured: 'true', limit: 8 }],
    queryFn: () => productApi.getProducts({ featured: true, limit: 8, sort: 'createdAt_desc' }),
  });

  const { data: bestData } = useQuery({
    queryKey: ['products', { sort: 'sales_desc', limit: 8 }],
    queryFn: () => productApi.getProducts({ sort: 'sales_desc', limit: 8 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  });

  return (
    <div>
      <section className="relative bg-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-36 flex flex-col items-center text-center">
          <p className="text-sm tracking-widest text-gray-500 mb-4 uppercase">New Season</p>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-none mb-6">
            SPRING<br />COLLECTION
          </h1>
          <p className="text-gray-500 mb-8 text-lg">가볍고 선명한 시즌 아이템을 만나보세요.</p>
          <Link to="/products?featured=true" className="btn-primary px-10 py-4 text-base tracking-wide">
            컬렉션 보기
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold mb-8">카테고리</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors text-gray-600 group-hover:text-black">
                  <CategoryIcon slug={cat.slug} />
                </div>
                <span className="text-xs text-center text-gray-700 font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-bold mb-1">무료배송</p>
              <p className="text-sm text-gray-400">5만원 이상 구매 시</p>
            </div>
            <div>
              <p className="font-bold mb-1">당일 출고</p>
              <p className="text-sm text-gray-400">오후 2시 이전 결제 완료 주문</p>
            </div>
            <div>
              <p className="font-bold mb-1">30일 교환/반품</p>
              <p className="text-sm text-gray-400">간편한 반품 접수</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">신상품</h2>
          <Link to="/products?featured=true" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
            전체보기 <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={newArrivalsData?.products} isLoading={!newArrivalsData} />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">베스트셀러</h2>
          <Link to="/products?sort=sales_desc" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
            전체보기 <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={bestData?.products} isLoading={!bestData} />
      </section>

      <RecentlyViewed />

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black text-white p-10 flex flex-col justify-between min-h-[200px]">
              <div>
                <p className="text-xs tracking-widest text-gray-400 mb-2 uppercase">Member Benefit</p>
                <h3 className="text-3xl font-bold leading-tight">회원 전용<br />구매 혜택</h3>
              </div>
              <Link to="/register" className="text-sm underline hover:no-underline mt-4">
                회원가입 하기
              </Link>
            </div>
            <div className="bg-gray-200 p-10 flex flex-col justify-between min-h-[200px]">
              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-2 uppercase">Free Shipping</p>
                <h3 className="text-3xl font-bold leading-tight">5만원 이상<br />무료배송</h3>
              </div>
              <Link to="/products" className="text-sm underline hover:no-underline mt-4">
                지금 쇼핑하기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
