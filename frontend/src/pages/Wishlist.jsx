import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { wishlistApi } from '../api/wishlist.api';
import { cartApi } from '../api/cart.api';
import { useCartStore } from '../store/cart.store';
import { formatPrice, formatDiscount, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const { openCart } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlist,
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => wishlistApi.removeFromWishlist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productId] });
      toast.success('위시리스트에서 제거되었습니다.', { duration: 1500 });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, variantId }) => cartApi.addItem({ productId, variantId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다.', { icon: '🛍️', duration: 2000 });
      openCart();
    },
    onError: (err) => toast.error(err.response?.data?.message || '장바구니 추가 실패'),
  });

  if (isLoading) return <PageSpinner />;

  const items = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="fill-red-500 text-red-500" />
        <h1 className="text-2xl font-bold">위시리스트</h1>
        <span className="text-gray-400 text-sm">({items.length}개)</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 mb-6">위시리스트가 비어있습니다.</p>
          <Link to="/products" className="btn-primary px-8 py-3">
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((product) => {
            const discount = formatDiscount(product.comparePrice, product.price);
            const images = product.images || [];
            const isOutOfStock = product.totalStock === 0;

            return (
              <div key={product.wishlistId} className="group relative">
                <Link to={`/products/${product.id}`} className="block">
                  <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden mb-3">
                    <img
                      src={getImageUrl(images[0])}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = 'https://placehold.co/300x400/f3f4f6/9ca3af?text=HAVIT'; }}
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="font-bold text-gray-500 text-sm">SOLD OUT</span>
                      </div>
                    )}
                    {discount && !isOutOfStock && (
                      <span className="absolute top-2 left-2 badge-sale">-{discount}%</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">{product.category?.name}</p>
                  <p className="text-sm font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                    {discount && <span className="text-xs text-red-500">{discount}%</span>}
                  </div>
                </Link>

                {/* 액션 버튼 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (isOutOfStock) return;
                      const variant = product.variants?.[0];
                      addToCartMutation.mutate({ productId: product.id, variantId: variant?.id });
                    }}
                    disabled={isOutOfStock || addToCartMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={14} />
                    {isOutOfStock ? '품절' : '장바구니'}
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(product.id)}
                    disabled={removeMutation.isPending}
                    className="p-2 border border-gray-200 hover:border-red-400 hover:text-red-500 transition-colors"
                    aria-label="위시리스트 제거"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
