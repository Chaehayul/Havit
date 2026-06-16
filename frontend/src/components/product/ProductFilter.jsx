import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../api/product.api';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '최신순' },
  { value: 'sales_desc', label: '판매순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
];

export default function ProductFilter({ filters, onFilterChange, total }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.getCategories });

  const allCategories = categories.flatMap((cat) => [cat, ...(cat.children || [])]);

  const activeFilterCount = [
    filters.category,
    filters.minPrice || filters.maxPrice,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFilterChange({ sort: 'createdAt_desc', category: '', minPrice: '', maxPrice: '' });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* 카테고리 */}
      <div>
        <p className="font-semibold text-sm mb-3">카테고리</p>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange({ ...filters, category: '' })}
            className={`w-full text-left text-sm py-1.5 transition-colors ${!filters.category ? 'font-semibold text-black' : 'text-gray-600 hover:text-black'}`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => onFilterChange({ ...filters, category: cat.slug })}
                className={`w-full text-left text-sm py-1.5 transition-colors ${filters.category === cat.slug ? 'font-semibold text-black' : 'text-gray-600 hover:text-black'}`}
              >
                {cat.name}
              </button>
              {cat.children?.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onFilterChange({ ...filters, category: sub.slug })}
                  className={`w-full text-left text-sm py-1.5 pl-4 transition-colors ${filters.category === sub.slug ? 'font-semibold text-black' : 'text-gray-400 hover:text-black'}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 가격 */}
      <div>
        <p className="font-semibold text-sm mb-3">가격</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="최소"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
          <span className="text-gray-400 shrink-0">~</span>
          <input
            type="number"
            placeholder="최대"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={handleReset} className="text-sm text-gray-500 underline hover:text-black">
          필터 초기화
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold">필터</h2>
            {activeFilterCount > 0 && (
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-black">초기화</button>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>

      {/* 모바일 상단 바 */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm border border-gray-200 px-3 py-2"
        >
          <SlidersHorizontal size={16} />
          필터
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">총 {total}개</span>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
            className="text-sm border border-gray-200 px-2 py-2 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 모바일 필터 서랍 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold">필터</span>
              <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setMobileOpen(false)} className="w-full btn-primary py-3">
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
