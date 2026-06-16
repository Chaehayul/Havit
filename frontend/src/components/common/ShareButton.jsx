import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareButton({ title, text, url }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다!', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="공유하기"
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
      <span className="hidden sm:inline">{copied ? '복사됨' : '공유'}</span>
    </button>
  );
}
