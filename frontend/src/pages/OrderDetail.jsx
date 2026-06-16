import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { orderApi } from '../api/order.api';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrder(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('주문이 취소되었습니다.');
    },
    onError: (err) => toast.error(err.response?.data?.message || '취소에 실패했습니다.'),
  });

  if (isLoading) return <PageSpinner />;
  if (!order) return <div className="text-center py-20">주문을 찾을 수 없습니다.</div>;

  const address = order.shippingAddress || {};
  const canCancel = ['PENDING', 'PAID'].includes(order.status);
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* 결제 성공 배너 */}
      {isSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-4 mb-8 rounded">
          <CheckCircle size={24} className="text-green-600 shrink-0" />
          <div>
            <p className="font-bold text-green-800">주문이 완료되었습니다!</p>
            <p className="text-sm text-green-600">주문 확인 이메일이 발송됩니다.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">주문 상세</h1>
        <span className={`text-sm px-3 py-1 font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* 주문 진행 상태 (취소/환불 아닌 경우) */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <div className="mb-8">
          <div className="relative flex justify-between">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
              />
            </div>
            {STATUS_STEPS.map((step, i) => {
              const isPast = i <= currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    isPast ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <p className={`text-xs mt-2 text-center ${isPast ? 'text-black font-medium' : 'text-gray-400'}`}>
                    {ORDER_STATUS_LABELS[step]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 주문 정보 */}
      <div className="border p-4 text-sm mb-5">
        <div className="flex justify-between mb-1">
          <span className="text-gray-500">주문번호</span>
          <span className="font-mono">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">주문일시</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        {order.paidAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">결제일시</span>
            <span>{formatDateTime(order.paidAt)}</span>
          </div>
        )}
      </div>

      {/* 주문 상품 */}
      <div className="border mb-5">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-sm">주문 상품</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item) => {
            const snapshot = item.snapshot || {};
            return (
              <div key={item.id} className="flex gap-4 p-4">
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <img
                    src={getImageUrl(snapshot.image || item.product?.images?.[0])}
                    alt={snapshot.name}
                    className="w-16 h-20 object-cover bg-gray-50"
                    onError={(e) => { e.target.src = 'https://placehold.co/64x80/f3f4f6/9ca3af?text=IMG'; }}
                  />
                </Link>
                <div className="flex-1">
                  <p className="font-medium text-sm">{snapshot.name}</p>
                  {item.options && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {typeof item.options === 'object' ? Object.values(item.options).join(' / ') : item.options}
                    </p>
                  )}
                  <p className="text-sm mt-2">
                    {formatPrice(item.price)} × {item.quantity}개 = <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 배송지 */}
      <div className="border p-4 text-sm mb-5">
        <h2 className="font-bold mb-3">배송 정보</h2>
        <p className="font-medium">{address.name}</p>
        <p className="text-gray-600">{address.phone}</p>
        <p className="text-gray-600 mt-1">[{address.zipCode}] {address.address1} {address.address2}</p>
        {address.memo && <p className="text-gray-400 text-xs mt-1">배송 메모: {address.memo}</p>}
      </div>

      {/* 결제 정보 */}
      <div className="border p-4 text-sm mb-6">
        <h2 className="font-bold mb-3">결제 정보</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>상품 금액</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>배송비</span>
            <span>{order.shippingFee === 0 ? <span className="text-green-600">무료</span> : formatPrice(order.shippingFee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>할인</span><span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>총 결제금액</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/orders" className="flex-1 btn-secondary text-center py-3 text-sm">
          주문 목록
        </Link>
        {canCancel && (
          <button
            onClick={() => {
              if (window.confirm('정말 주문을 취소하시겠습니까?')) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
            className="flex-1 border border-red-500 text-red-500 py-3 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            주문 취소
          </button>
        )}
      </div>
    </div>
  );
}
