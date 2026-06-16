import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { productApi } from '../../api/product.api';
import { formatPrice, getImageUrl } from '../../utils/format';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

export default function AdminProductList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productApi.getProducts({ page, limit: 20, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('상품이 비활성화되었습니다.');
    },
    onError: () => toast.error('처리에 실패했습니다.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => productApi.updateProduct(id, { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} /> 상품 등록
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="상품명 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-base max-w-xs"
        />
      </div>

      <div className="border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-16">이미지</th>
              <th className="text-left px-4 py-3 font-medium">상품명</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-left px-4 py-3 font-medium">가격</th>
              <th className="text-left px-4 py-3 font-medium">재고</th>
              <th className="text-left px-4 py-3 font-medium">상태</th>
              <th className="text-left px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">로딩 중...</td></tr>
            ) : data?.products?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">상품이 없습니다.</td></tr>
            ) : (
              data?.products?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-12 h-14 object-cover bg-gray-100"
                      onError={(e) => { e.target.src = 'https://placehold.co/48x56/f3f4f6/9ca3af?text=IMG'; }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400">ID: {product.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatPrice(product.price)}</p>
                    {product.comparePrice && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 5 ? 'text-orange-500' : 'text-green-600'}>
                      {product.totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 ${product.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.isActive ? '판매중' : '숨김'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/products/${product.id}`} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="수정">
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => toggleMutation.mutate({ id: product.id, isActive: product.isActive })}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title={product.isActive ? '숨기기' : '표시'}
                      >
                        {product.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('정말 삭제하시겠습니까?')) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data && (
        <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
