import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Pencil,
  Trash2,
} from 'lucide-react';
import { productApi } from '../api/product.api';
import { cartApi } from '../api/cart.api';
import { useCartStore } from '../store/cart.store';
import { useAuthStore } from '../store/auth.store';
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

const parseImageInput = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

function RatingInput({ value, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="text-yellow-400"
          aria-label={`${rating}점`}
        >
          <Star
            size={size}
            className={rating <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { openCart } = useCartStore();
  const { user } = useAuthStore();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [descOpen, setDescOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImages, setEditImages] = useState('');

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

  const refreshReviews = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    queryClient.invalidateQueries({ queryKey: ['product', id] });
  };

  const addToCartMutation = useMutation({
    mutationFn: (data) => cartApi.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다.');
      openCart();
    },
    onError: (err) => toast.error(err.response?.data?.message || '장바구니 추가에 실패했습니다.'),
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => productApi.createReview(id, data),
    onSuccess: () => {
      setReviewRating(5);
      setReviewComment('');
      setReviewImages('');
      setReviewPage(1);
      refreshReviews();
      toast.success('리뷰가 등록되었습니다.');
    },
    onError: (err) => toast.error(err.response?.data?.message || '리뷰 등록에 실패했습니다.'),
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }) => productApi.updateReview(id, reviewId, data),
    onSuccess: () => {
      setEditingReviewId(null);
      refreshReviews();
      toast.success('리뷰가 수정되었습니다.');
    },
    onError: (err) => toast.error(err.response?.data?.message || '리뷰 수정에 실패했습니다.'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => productApi.deleteReview(id, reviewId),
    onSuccess: () => {
      refreshReviews();
      toast.success('리뷰가 삭제되었습니다.');
    },
    onError: (err) => toast.error(err.response?.data?.message || '리뷰 삭제에 실패했습니다.'),
  });

  if (isLoading) return <PageSpinner />;
  if (!product) return <div className="text-center py-20">상품을 찾을 수 없습니다.</div>;

  const images = product.images || [];
  const options = product.options || [];
  const variants = product.variants || [];
  const discount = formatDiscount(product.comparePrice, product.price);

  const getSelectedVariant = () => {
    if (!variants.length) return null;
    return variants.find((variant) => {
      const opts = variant.options || {};
      return options.every((opt) => opts[opt.name] === selectedOptions[opt.name]);
    });
  };

  const selectedVariant = getSelectedVariant();
  const effectivePrice = selectedVariant?.price || product.price;
  const isFullySelected = options.every((opt) => selectedOptions[opt.name]);
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.totalStock === 0;
  const stockInfo = selectedVariant?.stock;

  const handleAddToCart = () => {
    if (options.length > 0 && !isFullySelected) {
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
    const variant = variants.find((v) => {
      const opts = v.options || {};
      return Object.entries(testOptions).every(([key, optionValue]) => opts[key] === optionValue);
    });
    return variant?.stock ?? null;
  };

  const handleCreateReview = (event) => {
    event.preventDefault();
    if (!user) {
      toast.error('로그인 후 리뷰를 작성할 수 있습니다.');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('리뷰 내용을 입력해주세요.');
      return;
    }
    createReviewMutation.mutate({
      rating: reviewRating,
      comment: reviewComment.trim(),
      images: parseImageInput(reviewImages),
    });
  };

  const startEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditImages((review.images || []).join('\n'));
  };

  const handleUpdateReview = (event) => {
    event.preventDefault();
    if (!editComment.trim()) {
      toast.error('리뷰 내용을 입력해주세요.');
      return;
    }
    updateReviewMutation.mutate({
      reviewId: editingReviewId,
      data: {
        rating: editRating,
        comment: editComment.trim(),
        images: parseImageInput(editImages),
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
        <div>
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

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`shrink-0 w-16 h-20 border-2 overflow-hidden transition-colors ${index === activeImage ? 'border-black' : 'border-transparent'}`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/64x80/f3f4f6/9ca3af?text=IMG'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400">{product.category?.name}</p>
            <div className="flex items-center gap-3">
              <ShareButton title={product.name} text={`${product.name} - HAVIT`} />
              <WishlistButton productId={product.id} size="lg" />
            </div>
          </div>
          <h1 className="text-2xl font-bold leading-snug mb-3">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star
                    key={rating}
                    size={14}
                    className={rating <= Math.round(product.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.avgRating} ({product.reviewCount}개 리뷰)</span>
            </div>
          )}

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold">{formatPrice(effectivePrice)}</span>
            {discount && product.comparePrice && (
              <>
                <span className="text-lg text-gray-400 line-through pb-0.5">{formatPrice(product.comparePrice)}</span>
                <span className="text-red-500 font-bold text-lg pb-0.5">{discount}%</span>
              </>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 text-sm space-y-1 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">배송</span>
              <span>오후 2시 이전 결제 시 당일 출고</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송비</span>
              <span>3,000원 (5만원 이상 무료)</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            {options.length > 0 && <p className="font-medium text-sm">옵션 선택</p>}
            <SizeGuide categorySlug={product.category?.slug} />
          </div>

          {options.map((option) => (
            <div key={option.id} className="mb-5">
              <p className="font-medium text-sm mb-2">{option.name}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value.value;
                  const stockForOption = getVariantStock(option.name, value.value);
                  const isSoldOut = stockForOption === 0;

                  if (value.color) {
                    return (
                      <button
                        key={value.id}
                        type="button"
                        title={`${value.value}${isSoldOut ? ' (품절)' : ''}`}
                        onClick={() => !isSoldOut && handleOptionSelect(option.name, value.value)}
                        disabled={isSoldOut}
                        className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                          isSelected ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'
                        } ${isSoldOut ? 'opacity-30 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: value.color }}
                      />
                    );
                  }

                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => !isSoldOut && handleOptionSelect(option.name, value.value)}
                      disabled={isSoldOut}
                      className={`px-4 py-2 text-sm border transition-all ${
                        isSelected ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'
                      } ${isSoldOut ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {value.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedVariant && stockInfo !== null && stockInfo > 0 && stockInfo <= 5 && (
            <p className="text-orange-500 text-sm mb-4">재고가 {stockInfo}개 남았습니다.</p>
          )}

          <div className="flex items-center justify-between mb-6">
            <p className="font-medium text-sm">수량</p>
            <div className="flex items-center border">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-50 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 text-base min-w-[3rem] text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={stockInfo !== null && quantity >= stockInfo}
                className="p-3 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-4 border-t border-b mb-6">
            <span className="font-medium">총 금액</span>
            <span className="text-2xl font-bold">{formatPrice(effectivePrice * quantity)}</span>
          </div>

          <div className="space-y-3">
            <button
              type="button"
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

          <TrustBadges className="mt-6" />
        </div>
      </div>

      <div className="mt-16 max-w-3xl">
        <button
          type="button"
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

      <div className="mt-8 border-t pt-8 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">
            리뷰 {reviewsData?.stats?.total > 0 && `(${reviewsData.stats.total})`}
          </h2>
          {!user && (
            <Link to="/login" className="text-sm text-gray-500 underline hover:text-black">
              로그인 후 리뷰 작성
            </Link>
          )}
        </div>

        {user && (
          <form onSubmit={handleCreateReview} className="border p-5 mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">구매 리뷰 작성</p>
              <RatingInput value={reviewRating} onChange={setReviewRating} />
            </div>
            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              className="input-base min-h-[110px] resize-none"
              placeholder="상품을 사용해본 경험을 남겨주세요. 구매 완료 이력이 있는 상품만 등록됩니다."
            />
            <textarea
              value={reviewImages}
              onChange={(event) => setReviewImages(event.target.value)}
              className="input-base min-h-[74px] resize-none"
              placeholder="리뷰 이미지 URL을 한 줄에 하나씩 입력하세요. 선택 사항입니다."
            />
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              리뷰 등록
            </button>
          </form>
        )}

        {reviewsData?.stats?.total > 0 && (
          <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-5xl font-bold">{reviewsData.stats.avgRating}</p>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star key={rating} size={14} className={rating <= Math.round(reviewsData.stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{reviewsData.stats.total}개 리뷰</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
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
          {reviewsData?.reviews?.map((review) => {
            const isMine = user?.id === review.user.id;
            const isEditing = editingReviewId === review.id;

            return (
              <div key={review.id} className="border-b pb-6">
                {isEditing ? (
                  <form onSubmit={handleUpdateReview} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <RatingInput value={editRating} onChange={setEditRating} size={18} />
                      <button
                        type="button"
                        onClick={() => setEditingReviewId(null)}
                        className="text-xs text-gray-500 underline"
                      >
                        취소
                      </button>
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(event) => setEditComment(event.target.value)}
                      className="input-base min-h-[90px] resize-none"
                    />
                    <textarea
                      value={editImages}
                      onChange={(event) => setEditImages(event.target.value)}
                      className="input-base min-h-[70px] resize-none"
                      placeholder="리뷰 이미지 URL"
                    />
                    <button
                      type="submit"
                      disabled={updateReviewMutation.isPending}
                      className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                    >
                      수정 저장
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.user.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star key={rating} size={12} className={rating <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                        {isMine && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditReview(review)}
                              className="p-1 text-gray-400 hover:text-black"
                              aria-label="리뷰 수정"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteReviewMutation.mutate(review.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              aria-label="리뷰 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img) => (
                          <img key={img} src={getImageUrl(img)} alt="리뷰 이미지" className="w-16 h-16 object-cover bg-gray-50" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {reviewsData?.stats?.total === 0 && (
            <p className="text-gray-400 text-center py-8">아직 리뷰가 없습니다. 구매 후 첫 리뷰를 남겨보세요.</p>
          )}
        </div>

        {reviewsData && reviewsData.pagination.totalPages > 1 && (
          <Pagination
            currentPage={reviewPage}
            totalPages={reviewsData.pagination.totalPages}
            onPageChange={setReviewPage}
          />
        )}
      </div>

      <RecentlyViewed excludeId={product.id} />

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
