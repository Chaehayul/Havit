import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    if (left > 1) { pages.unshift('...'); pages.unshift(1); }
    if (right < totalPages) { pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 disabled:opacity-30 hover:bg-gray-100 rounded transition-colors"
        aria-label="이전 페이지"
      >
        <ChevronLeft size={18} />
      </button>
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">···</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 text-sm rounded transition-colors ${
              page === currentPage ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 disabled:opacity-30 hover:bg-gray-100 rounded transition-colors"
        aria-label="다음 페이지"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
