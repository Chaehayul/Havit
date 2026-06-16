import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import Pagination from '../components/common/Pagination';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '최신순' },
  { value: 'sales_desc', label: '판매순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const filters = {
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'createdAt_desc',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featured: searchParams.get('featured') || '',
  };

  useEffect(() => { setPage(1); }, [searchParams.toString()]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters, page],
    queryFn: () => productApi.getProducts({ ...filters, page, limit: 24 }),
    keepPreviousData: true,
  });

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const title = filters.search
    ? `"${filters.search}" 검색결과`
    : filters.featured
    ? '신상품'
    : filters.category
    ? filters.category
    : '전체 상품';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {data && <p className="text-sm text-gray-500 mt-1">총 {data.pagination.total}개</p>}
      </div>

      <div className="flex gap-10">
        <ProductFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          total={data?.pagination.total || 0}
        />

        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">총 {data?.pagination.total || 0}개</p>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
              className="text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:border-black"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <ProductGrid
            products={data?.products}
            isLoading={isLoading}
            emptyMessage={filters.search ? '검색 결과가 없습니다.' : '상품이 없습니다.'}
          />

          {data && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
