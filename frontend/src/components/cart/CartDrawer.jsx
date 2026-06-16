import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart.api';
import { useCartStore } from '../../store/cart.store';
import { formatPrice, getImageUrl } from '../../utils/format';
import Spinner from '../common/Spinner';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

export default function CartDrawer() {
  const { isOpen, closeCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartApi.updateItem(itemId, quantity),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => cartApi.removeItem(itemId),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.variants?.find((v) => v.id === item.variantId)?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const remainForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={closeCart} />
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col animate-slide-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="font-bold text-lg">장바구니</h2>
            <span className="text-sm text-gray-400">({items.length})</span>
          </div>
          <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 무료배송 진행 바 */}
        {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
          <div className="px-5 py-3 bg-gray-50 border-b">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>{formatPrice(remainForFreeShipping)} 더 담으면 무료배송!</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        {subtotal >= FREE_SHIPPING_THRESHOLD && items.length > 0 && (
          <div className="px-5 py-3 bg-black text-white text-center text-xs">
            무료배송 조건 충족! 🎉
          </div>
        )}

        {/* 상품 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>장바구니가 비어있습니다.</p>
              <button onClick={closeCart} className="btn-secondary text-sm px-4 py-2">
                쇼핑 계속하기
              </button>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const variant = item.product.variants?.find((v) => v.id === item.variantId);
                const price = variant?.price || item.product.price;
                const images = item.product.images || [];
                const isUpdating = updateMutation.isPending || removeMutation.isPending;

                return (
                  <li key={item.id} className="flex gap-3 p-4">
                    <Link to={`/products/${item.product.id}`} onClick={closeCart} className="shrink-0">
                      <img
                        src={getImageUrl(images[0])}
                        alt={item.product.name}
                        className="w-20 h-24 object-cover bg-gray-50"
                        onError={(e) => { e.target.src = 'https://placehold.co/80x96/f3f4f6/9ca3af?text=IMG'; }}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.id}`} onClick={closeCart}>
                        <p className="text-sm font-medium line-clamp-2 hover:underline">{item.product.name}</p>
                      </Link>
                      {item.options && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Object.values(item.options).join(' / ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border">
                          <button
                            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="p-1.5 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-sm min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                            disabled={isUpdating}
                            className="p-1.5 hover:bg-gray-50 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-sm">{formatPrice(price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      disabled={isUpdating}
                      className="p-1 h-fit hover:text-red-500 transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 하단 결제 영역 */}
        {items.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span>{shippingFee === 0 ? <span className="text-green-600">무료</span> : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>총 결제금액</span><span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full btn-primary text-center py-4 text-base font-bold"
            >
              구매하기
            </Link>
            <Link
              to="/cart"
              onClick={closeCart}
              className="block w-full btn-secondary text-center py-3 text-sm"
            >
              장바구니 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
