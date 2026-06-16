import { ShieldCheck, Lock, RotateCcw, Eye } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: '정품 보장', sub: '검수된 상품만 판매' },
  { icon: Lock, label: '안전 결제', sub: 'PortOne 결제 검증' },
  { icon: RotateCcw, label: '간편 반품', sub: '30일 이내 접수' },
  { icon: Eye, label: '개인정보 보호', sub: '안전한 데이터 관리' },
];

export default function TrustBadges({ className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {BADGES.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-lg text-center"
        >
          <Icon size={20} className="text-gray-600" />
          <p className="text-xs font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
