import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../api/wishlist.api';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function WishlistButton({ productId, size = 'md', className = '' }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);

  const { data } = useQuery({
    queryKey: ['wishlist-check', productId],
    queryFn: () => wishlistApi.checkWishlist(productId),
    enabled: !!user,
    staleTime: 60000,
  });

  const isWishlisted = data?.isWishlisted ?? false;

  const toggleMutation = useMutation({
    mutationFn: () =>
      isWishlisted ? wishlistApi.removeFromWishlist(productId) : wishlistApi.addToWishlist(productId),
    onMutate: () => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productId] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (!isWishlisted) toast.success('위시리스트에 추가되었습니다.', { icon: '♥', duration: 1500 });
      else toast.success('위시리스트에서 제거되었습니다.', { duration: 1500 });
    },
    onError: () => toast.error('오류가 발생했습니다.'),
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('로그인 후 이용 가능합니다.', { icon: '🔒' });
      navigate('/login');
      return;
    }
    toggleMutation.mutate();
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <button
      onClick={handleClick}
      aria-label={isWishlisted ? '위시리스트에서 제거' : '위시리스트에 추가'}
      className={`transition-transform ${animating ? 'scale-125' : 'scale-100'} ${className}`}
    >
      <Heart
        size={iconSize}
        className={`transition-colors duration-200 ${
          isWishlisted
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        }`}
      />
    </button>
  );
}
