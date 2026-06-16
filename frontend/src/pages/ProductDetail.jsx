import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Minus, Plus, ShoppingBag, Star, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import { productApi } from '../api/product.api';
import { cartApi } from '../api/cart.api';
import { useCartStore } from '../store/cart.store';
import { formatPrice, formatDiscount, formatDate, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import WishlistButton from '../components/product/WishlistButton';
import SizeGuide from '../components/product/SizeGuide';
import RestockAlert from '../components/product/RestockAlert';
import TrustBadges from '../components/common/TrustBadges';
import ShareButton from '../components/common/ShareButton';
import RecentlyViewed from '../components/product/RecentlyViewed';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { openCart } = useCartStore();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [descOpen, setDescOpen] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(id),
  });

  useRecentlyViewed(product);

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id, reviewPage],
    queryFn: () => productApi.getReviews(id, { page: reviewPage, limit: 5 }),
    enabled: !!product,
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => cartApi.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다.', { icon: '🛍️' });
      openCart();
    },
    onError: (err) => toast.error(err.response?.data?.message || '장바구니 추가 실패'),
  });

  if (isLoading) return <PageSpinner />;
  if (!product) return <div className="text-center py-20">상품을 찾을 수 없습니다.</div>;

  const images = product.images || [];
  const discount = formatDiscount(product.comparePrice, product.price);

  // 선택된 옵션에 해당하는 variant 찾기
  const getSelectedVariant = () => {
    if (!product.variants?.length) return null;
    return product.variants.find((v) => {
      const opts = v.options || {};
      return product.options.every((opt) => opts[opt.name] === selectedOptions[opt.name]);
    });
  };

  const selectedVariant = getSelectedVariant();
  const effectivePrice = selectedVariant?.price || product.price;
  const isFullySelected = product.options.every((opt) => selectedOptions[opt.name]);
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.totalStock === 0;
  const stockInfo = selectedVariant?.stock;

  const handleAddToCart = () => {
    if (product.options.length > 0 && !isFullySelected) {
      toast.error('옵션을 선택해주세요.');
      return;
    }
    addToCartMutation.mutate({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity,
      options: isFullySelected ? selectedOptions : null,
    });
  };

  const handleOptionSelect = (optionName, value) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const getVariantStock = (optionName, value) => {
    const testOptions = { ...selectedOptions, [optionName]: value };
    const variant = product.variants.find((v) => {
      const opts = v.options || {};
      return Object.entries(testOptions).every(([k, v2]) => opts[k] === v2);
    });
    return variant?.stock ?? null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-black transition-colors">홈</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-black transition-colors">전체 상품</Link>
        {product.category?.parent && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.category.parent.slug}`} className="hover:text-black transition-colors">
              {product.category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <Link to={`/products?category=${product.category?.slug}`} className="hover:text-black transition-colors">
          {product.category?.name}
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 truncate max-w-[150px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* 이미지 섹션 */}
        <div>
          {/* 메인 이미지 */}
          <div
            className="relative overflow-hidden bg-gray-50 aspect-[3/4] cursor-zoom-in group"
            onClick={() => setZoomedImage(images[activeImage])}
          >
            <img
              src={getImageUrl(images[activeImage])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.src = 'https://placehold.co/600x800/f3f4f6/9ca3af?text=HAVIT'; }}
            />
            <div className="absolute bottom-3 right-3 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={16} />
            </div>
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-600">SOLD OUT</span>
              </div>
            )}
          </div>

          {/* 썸네일 */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-20 border-2 overflow-hidden transition-colors ${i === activeImage ? 'border-black' : 'border-transparent'}`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/64x80/f3f4f6/9ca3af?text=IMG'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400">{product.category?.name}</p>
            <div className="flex items-center gap-3">
              <ShareButton title={product.name} text={`${product.name} - HAVIT`} />
              <WishlistButton productId={product.id} size="lg" />
            </div>
          </div>
          <h1 className="text-2xl font-bold leading-snug mb-3">{product.name}</h1>

          {/* 평점 */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i <= Math.round(product.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.avgRating} ({product.reviewCount}개 리뷰)</span>
            </div>
          )}

          {/* 가격 */}
          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold">{formatPrice(effectivePrice)}</span>
            {discount && product.comparePrice && (
              <>
                <span className="text-lg text-gray-400 line-through pb-0.5">{formatPrice(product.comparePrice)}</span>
                <span className="text-red-500 font-bold text-lg pb-0.5">{discount}%</span>
              </>
            )}
          </div>

          {/* 배송 정보 */}
          <div className="bg-gray-50 px-4 py-3 text-sm space-y-1 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">배송</span>
              <span>오후 2시 이전 주문 시 당일 출고</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송비</span>
              <span>3,000원 (5만원 이상 무료)</span>
            </div>
          </div>

          {/* 옵션 선택 */}
          <div className="flex items-center justify-between mb-4">
            {product.options.length > 0 && <p className="font-medium text-sm">옵션 선택</p>}
            <SizeGuide categorySlug={product.category?.slug} />
          </div>
          {product.options.map((option) => (
            <div key={option.id} className="mb-5">
              <p className="font-medium text-sm mb-2">{option.name}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val) => {
                  const isSelected = selectedOptions[option.name] === val.value;
                  const stockForOption = getVariantStock(option.name, val.value);
                  const isSoldOut = stockForOption === 0;

                  if (val.color) {
                    return (
                      <button
                        key={val.id}
                        title={`${val.value}${isSoldOut ? ' (품절)' : ''}`}
                        onClick={() => !isSoldOut && handleOptionSelect(option.name, val.value)}
                        disabled={isSoldOut}
                        className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                          isSelected ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'
                        } ${isSoldOut ? 'opacity-30 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: val.color }}
                      />
                    );
                  }

                  return (
                    <button
                      key={val.id}
                      onClick={() => !isSoldOut && handleOptionSelect(option.name, val.value)}
                      disabled={isSoldOut}
                      className={`px-4 py-2 text-sm border transition-all ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-black'
                      } ${isSoldOut ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {val.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 재고 경고 */}
          {selectedVariant && stockInfo !== null && stockInfo > 0 && stockInfo <= 5 && (
            <p className="text-orange-500 text-sm mb-4">⚠ 재고가 {stockInfo}개 남았습니다.</p>
          )}

          {/* 수량 선택 */}
          <div className="flex items-center justify-between mb-6">
            <p className="font-medium text-sm">수량</p>
            <div className="flex items-center border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-50 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 text-base min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                disabled={stockInfo !== null && quantity >= stockInfo}
                className="p-3 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* 총 금액 */}
          <div className="flex justify-between items-center py-4 border-t border-b mb-6">
            <span className="font-medium">총 금액</span>
            <span className="text-2xl font-bold">{formatPrice(effectivePrice * quantity)}</span>
          </div>

          {/* 구매 버튼 */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addToCartMutation.isPending}
              className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag size={20} />
              {isOutOfStock ? '품절된 상품입니다' : '장바구니 담기'}
            </button>
            {isOutOfStock && (
              <RestockAlert productId={product.id} variantId={selectedVariant?.id || null} />
            )}
          </div>

          {/* 신뢰 배지 */}
          <TrustBadges className="mt-6" />
        </div>
      </div>

      {/* 상품 설명 */}
      <div className="mt-16 max-w-3xl">
        <button
          className="w-full flex items-center justify-between py-4 border-t font-bold text-lg"
          onClick={() => setDescOpen(!descOpen)}
        >
          상품 상세
          {descOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {descOpen && (
          <div className="pb-8 prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        )}
      </div>

      {/* 리뷰 섹션 */}
      <div className="mt-8 border-t pt-8 max-w-3xl">
        <h2 className="text-xl font-bold mb-6">
          리뷰 {reviewsData?.stats?.total > 0 && `(${reviewsData.stats.total})`}
        </h2>

        {reviewsData?.stats?.total > 0 && (
          <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-5xl font-bold">{reviewsData.stats.avgRating}</p>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={14} className={i <= Math.round(reviewsData.stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{reviewsData.stats.total}개 리뷰</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map((rating) => {
                const count = reviewsData.stats.distribution[rating] || 0;
                const pct = reviewsData.stats.total > 0 ? (count / reviewsData.stats.total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right text-gray-500">{rating}</span>
                    <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {reviewsData?.reviews?.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.user.name}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} size={12} className={i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
              {review.images?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, i) => (
                    <img key={i} src={getImageUrl(img)} alt="리뷰 이미지" className="w-16 h-16 object-cover bg-gray-50" />
                  ))}
                </div>
              )}
            </div>
          ))}
          {reviewsData?.stats?.total === 0 && (
            <p className="text-gray-400 text-center py-8">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
          )}
        </div>
        {reviewsData && (
          <Pagination
            currentPage={reviewPage}
            totalPages={reviewsData.pagination.totalPages}
            onPageChange={setReviewPage}
          />
        )}
      </div>

      {/* 최근 본 상품 */}
      <RecentlyViewed excludeId={product.id} />

      {/* 이미지 줌 모달 */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={getImageUrl(zoomedImage)}
            alt="확대 이미지"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
