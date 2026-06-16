import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart.api';
import { formatPrice, formatDiscount, getImageUrl } from '../../utils/format';
import { useCartStore } from '../../store/cart.store';
import WishlistButton from './WishlistButton';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { openCart } = useCartStore();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, variantId }) => cartApi.addItem({ productId, variantId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다.', {
        icon: '🛍️',
        duration: 2000,
      });
      openCart();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || '장바구니 추가에 실패했습니다.');
    },
  });

  const discount = formatDiscount(product.comparePrice, product.price);
  const images = product.images || [];
  const isOutOfStock = product.totalStock === 0;
  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    // 옵션이 없거나 단일 variant인 경우 바로 추가
    if (!product.variants || product.variants.length === 0) {
      addToCartMutation.mutate({ productId: product.id });
    } else if (product.variants.length === 1) {
      addToCartMutation.mutate({ productId: product.id, variantId: product.variants[0].id });
    } else {
      // 옵션 선택 필요 → 상품 상세 페이지로
      window.location.href = `/products/${product.id}`;
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden bg-gray-50 aspect-[3/4]">
        {/* 상품 이미지 */}
        <img
          src={getImageUrl(images[0])}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/400x500/f3f4f6/9ca3af?text=HAVIT'; }}
        />
        {/* 호버 시 두 번째 이미지 */}
        {images[1] && (
          <img
            src={getImageUrl(images[1])}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://placehold.co/400x500/f3f4f6/9ca3af?text=HAVIT'; }}
          />
        )}

        {/* 위시리스트 버튼 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-1.5">
          <WishlistButton productId={product.id} size="sm" />
        </div>

        {/* 배지 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && <span className="badge-soldout">SOLD OUT</span>}
          {!isOutOfStock && discount && <span className="badge-sale">-{discount}%</span>}
          {!isOutOfStock && isLowStock && <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 font-medium">품절 임박</span>}
          {product.isFeatured && !isOutOfStock && <span className="badge-new">NEW</span>}
        </div>

        {/* 빠른 장바구니 버튼 */}
        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock || addToCartMutation.isPending}
          className="absolute bottom-0 left-0 right-0 bg-black/80 text-white py-3 text-sm font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex items-center justify-center gap-2 disabled:bg-gray-500"
          aria-label="빠른 장바구니 추가"
        >
          <ShoppingBag size={16} />
          {isOutOfStock ? '품절' : '장바구니 담기'}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-gray-400 truncate">{product.category?.name}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{formatPrice(product.price)}</span>
          {discount && product.comparePrice && (
            <>
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
              <span className="text-sm text-red-500 font-medium">{discount}%</span>
            </>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-gray-500">{product.avgRating} ({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
