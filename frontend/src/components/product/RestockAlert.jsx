import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { wishlistApi } from '../../api/wishlist.api';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

export default function RestockAlert({ productId, variantId = null }) {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [subscribed, setSubscribed] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await wishlistApi.subscribeRestock({ productId, variantId, email });
      setSubscribed(true);
      setOpen(false);
      toast.success('재입고 알림이 등록되었습니다!', { icon: '🔔', duration: 3000 });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('Unique constraint')) {
        toast('이미 알림 신청하셨습니다.', { icon: 'ℹ️' });
        setSubscribed(true);
        setOpen(false);
      } else {
        toast.error(msg || '오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 py-2">
        <Check size={16} />
        재입고 시 알림을 보내드립니다.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm border border-gray-300 px-4 py-2.5 hover:border-black transition-colors w-full justify-center"
        >
          <Bell size={16} />
          재입고 알림 받기
        </button>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">재입고 시 이메일로 알려드릴게요</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 입력"
                className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading ? '...' : '신청'}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <BellOff size={12} /> 취소
          </button>
        </form>
      )}
    </div>
  );
}
