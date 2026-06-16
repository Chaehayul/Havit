import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { formatPrice, formatDiscount, getImageUrl } from '../../utils/format';

export default function RecentlyViewed({ excludeId = null }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const all = getRecentlyViewed();
    setItems(excludeId ? all.filter((p) => p.id !== excludeId) : all);
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t">
      <h2 className="text-lg font-bold mb-6">최근 본 상품</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {items.map((product) => {
          const discount = formatDiscount(product.comparePrice, product.price);
          const images = product.images || [];
          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="shrink-0 w-36 group"
            >
              <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden mb-2">
                <img
                  src={getImageUrl(images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.target.src = 'https://placehold.co/144x192/f3f4f6/9ca3af?text=HAVIT'; }}
                />
                {product.totalStock === 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">SOLD OUT</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-900 font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                {discount && <span className="text-xs text-red-500">{discount}%</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
