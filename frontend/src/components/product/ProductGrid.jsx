import ProductCard from './ProductCard';
import { PageSpinner } from '../common/Spinner';

export default function ProductGrid({ products, isLoading, emptyMessage = '상품이 없습니다.' }) {
  if (isLoading) return <PageSpinner />;

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 lg:gap-x-6 gap-y-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
