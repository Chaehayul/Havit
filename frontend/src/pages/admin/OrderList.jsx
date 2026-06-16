import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/order.api';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/format';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-orders', page, status],
    queryFn: () => orderApi.getAllOrders({ page, limit: 20, status: status || undefined }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => orderApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-orders'] });
      toast.success('주문 상태가 변경되었습니다.');
    },
    onError: () => toast.error('상태 변경에 실패했습니다.'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">주문 관리</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={status}
          onChange={(e) => {
            const nextStatus = e.target.value;
            setStatus(nextStatus);
            setPage(1);
            setSearchParams(nextStatus ? { status: nextStatus } : {});
          }}
          className="input-base max-w-xs"
        >
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {data && <p className="text-sm text-gray-500">총 {data.pagination.total}건</p>}
      </div>

      <div className="border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">주문번호</th>
              <th className="text-left px-4 py-3 font-medium">주문자</th>
              <th className="text-left px-4 py-3 font-medium">상품</th>
              <th className="text-left px-4 py-3 font-medium">금액</th>
              <th className="text-left px-4 py-3 font-medium">상태 변경</th>
              <th className="text-left px-4 py-3 font-medium">날짜</th>
              <th className="text-left px-4 py-3 font-medium">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">로딩 중...</td></tr>
            ) : data?.orders?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">주문이 없습니다.</td></tr>
            ) : (
              data?.orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p>{order.user?.name || order.guestName || '비회원'}</p>
                    <p className="text-xs text-gray-400">{order.user?.email || order.guestEmail || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 max-w-[150px]">
                      {order.items?.[0]?.snapshot?.name}
                      {order.items?.length > 1 && <span className="text-gray-400"> 외 {order.items.length - 1}건</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                      disabled={updateStatusMutation.isPending}
                      className={`text-xs px-2 py-1 border cursor-pointer focus:outline-none ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_OPTIONS.filter(Boolean).map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="text-xs underline hover:text-black text-gray-500">
                      보기
                    </Link>
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
