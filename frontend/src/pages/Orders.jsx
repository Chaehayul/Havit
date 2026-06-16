import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';

const STATUS_TABS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'PREPARING', label: '배송 준비' },
  { value: 'SHIPPED', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CANCELLED', label: '취소' },
];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, page],
    queryFn: () => orderApi.getOrders({ status: status || undefined, page, limit: 10 }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">주문 내역</h1>

      {/* 상태 탭 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              status === tab.value ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(!data?.orders || data.orders.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">주문 내역이 없습니다.</p>
          <Link to="/products" className="btn-secondary text-sm px-6 py-2">쇼핑하기</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => {
            const firstItem = order.items?.[0];
            const images = firstItem?.product?.images || [];
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block border hover:border-gray-400 transition-colors p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    <span className="text-xs text-gray-400 ml-3">주문번호: {order.orderNumber}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 font-medium rounded-sm ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(images[0])}
                    alt=""
                    className="w-16 h-20 object-cover bg-gray-50 shrink-0"
                    onError={(e) => { e.target.src = 'https://placehold.co/64x80/f3f4f6/9ca3af?text=IMG'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">
                      {firstItem?.snapshot?.name}
                      {order.items.length > 1 && <span className="text-gray-400"> 외 {order.items.length - 1}건</span>}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      총 {formatPrice(order.total)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
