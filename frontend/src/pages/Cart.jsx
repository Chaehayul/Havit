import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { cartApi } from '../api/cart.api';
import { formatPrice, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

export default function Cart() {
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: cartApi.getCart });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartApi.updateItem(itemId, quantity),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });
  const removeMutation = useMutation({
    mutationFn: (itemId) => cartApi.removeItem(itemId),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  if (isLoading) return <PageSpinner />;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.variants?.find((v) => v.id === item.variantId)?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={64} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold mb-2">장바구니가 비어있습니다</h1>
        <p className="text-gray-500 mb-8">마음에 드는 상품을 담아보세요.</p>
        <Link to="/products" className="btn-primary inline-block px-10 py-4">
          쇼핑 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">장바구니 ({items.length})</h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        {/* 상품 목록 */}
        <div className="lg:col-span-2">
          <div className="border-t">
            {items.map((item) => {
              const variant = item.product.variants?.find((v) => v.id === item.variantId);
              const price = variant?.price || item.product.price;
              const images = item.product.images || [];

              return (
                <div key={item.id} className="flex gap-5 py-6 border-b">
                  <Link to={`/products/${item.product.id}`} className="shrink-0">
                    <img
                      src={getImageUrl(images[0])}
                      alt={item.product.name}
                      className="w-24 h-32 sm:w-28 sm:h-36 object-cover bg-gray-50"
                      onError={(e) => { e.target.src = 'https://placehold.co/112x144/f3f4f6/9ca3af?text=IMG'; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link to={`/products/${item.product.id}`} className="font-medium hover:underline line-clamp-2">
                          {item.product.name}
                        </Link>
                        {item.options && (
                          <p className="text-sm text-gray-400 mt-1">
                            {Object.values(item.options).join(' / ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        className="shrink-0 p-1 hover:text-red-500 transition-colors h-fit"
                        aria-label="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border">
                        <button
                          onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                          className="p-2 hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="font-bold">{formatPrice(price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 주문 요약 */}
        <div className="mt-8 lg:mt-0">
          <div className="border p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-5">주문 요약</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">상품 금액</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">배송비</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600">무료</span>
                  ) : formatPrice(shippingFee)}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-gray-400 pb-1">
                  {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} 더 담으면 무료배송
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>총 결제금액</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-6 flex items-center justify-center gap-2 w-full btn-primary py-4 text-base font-bold"
            >
              구매하기
              <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="mt-3 flex items-center justify-center text-sm text-gray-500 hover:text-black transition-colors">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
