import { useEffect } from 'react';

const STORAGE_KEY = 'havit_recently_viewed';
const MAX_ITEMS = 12;

export function useRecentlyViewed(product) {
  useEffect(() => {
    if (!product?.id) return;
    const stored = getRecentlyViewed();
    const filtered = stored.filter((p) => p.id !== product.id);
    const updated = [
      {
        id: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        images: product.images || [],
        totalStock: product.totalStock,
        category: product.category,
        avgRating: product.avgRating,
        reviewCount: product.reviewCount,
      },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [product?.id]);
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}
