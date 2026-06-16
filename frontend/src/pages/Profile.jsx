import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Package, MapPin, Lock, LogOut, Plus, Pencil, Trash2 } from 'lucide-react';
import { userApi } from '../api/user.api';
import { orderApi } from '../api/order.api';
import { useAuthStore } from '../store/auth.store';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'info', label: '회원 정보', icon: User },
  { id: 'orders', label: '주문 내역', icon: Package },
  { id: 'addresses', label: '배송지 관리', icon: MapPin },
  { id: 'password', label: '비밀번호 변경', icon: Lock },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('info');
  const [editingAddress, setEditingAddress] = useState(null);
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.getOrders({ limit: 5 }),
    enabled: activeTab === 'orders',
  });

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: userApi.getAddresses,
    enabled: activeTab === 'addresses',
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('로그아웃되었습니다.');
  };

  // 프로필 수정 폼
  const ProfileForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      defaultValues: { name: user?.name, phone: user?.phone },
    });
    const mutation = useMutation({
      mutationFn: (data) => userApi.updateProfile(data),
      onSuccess: (data) => { updateUser(data); toast.success('프로필이 업데이트되었습니다.'); },
    });
    return (
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input {...register('name', { required: true })} className={`input-base ${errors.name ? 'input-error' : ''}`} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">휴대폰</label>
          <input {...register('phone')} className="input-base" placeholder="010-0000-0000" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input value={user?.email} disabled className="input-base bg-gray-50 text-gray-400" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary px-8 py-2.5 text-sm">
          {mutation.isPending ? '저장 중...' : '저장'}
        </button>
      </form>
    );
  };

  // 비밀번호 변경 폼
  const PasswordForm = () => {
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
    const mutation = useMutation({
      mutationFn: (data) => userApi.changePassword(data),
      onSuccess: () => { toast.success('비밀번호가 변경되었습니다.'); reset(); },
      onError: (err) => toast.error(err.response?.data?.message || '변경 실패'),
    });
    const newPassword = watch('newPassword');
    return (
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
          <input {...register('currentPassword', { required: true })} type="password" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호</label>
          <input {...register('newPassword', { required: true, minLength: { value: 8, message: '8자 이상' } })} type="password" className={`input-base ${errors.newPassword ? 'input-error' : ''}`} />
          {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
          <input {...register('confirm', { validate: (v) => v === newPassword || '비밀번호가 일치하지 않습니다.' })} type="password" className={`input-base ${errors.confirm ? 'input-error' : ''}`} />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary px-8 py-2.5 text-sm">
          {mutation.isPending ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    );
  };

  // 주소 폼
  const AddressForm = ({ address, onCancel, onSave }) => {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
      defaultValues: address || {},
    });
    const openKakaoPostcode = () => {
      new window.daum.Postcode({
        oncomplete: (data) => { setValue('zipCode', data.zonecode); setValue('address1', data.address); },
      }).open();
    };
    return (
      <form onSubmit={handleSubmit(onSave)} className="border p-4 space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">이름 *</label>
            <input {...register('name', { required: true })} className="input-base text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">연락처 *</label>
            <input {...register('phone', { required: true })} className="input-base text-sm py-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <input {...register('zipCode', { required: true })} readOnly placeholder="우편번호" className="input-base text-sm py-2 flex-1 bg-gray-50" onClick={openKakaoPostcode} />
          <button type="button" onClick={openKakaoPostcode} className="btn-secondary text-xs px-3 py-2">주소 검색</button>
        </div>
        <input {...register('address1')} readOnly className="input-base text-sm py-2 bg-gray-50" placeholder="기본 주소" />
        <input {...register('address2')} className="input-base text-sm py-2" placeholder="상세 주소" />
        <label className="flex items-center gap-2 text-sm">
          <input {...register('isDefault')} type="checkbox" />
          기본 배송지로 설정
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm px-4 py-2">저장</button>
          <button type="button" onClick={onCancel} className="btn-ghost text-sm">취소</button>
        </div>
      </form>
    );
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => userApi.deleteAddress(id),
    onSuccess: () => { refetchAddresses(); toast.success('주소가 삭제되었습니다.'); },
  });

  const saveAddress = useMutation({
    mutationFn: (data) => editingAddress?.id
      ? userApi.updateAddress(editingAddress.id, data)
      : userApi.createAddress(data),
    onSuccess: () => {
      refetchAddresses();
      setEditingAddress(null);
      toast.success('주소가 저장되었습니다.');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{user?.name}님</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
          <LogOut size={16} />로그아웃
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* 사이드 탭 */}
        <nav className="mb-6 lg:mb-0">
          <ul className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                    activeTab === id ? 'bg-black text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 콘텐츠 */}
        <div className="lg:col-span-3">
          {activeTab === 'info' && (
            <div>
              <h2 className="text-lg font-bold mb-5">회원 정보</h2>
              <ProfileForm />
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-bold mb-5">최근 주문 내역</h2>
              {ordersLoading ? <PageSpinner /> : (
                <>
                  {ordersData?.orders?.length === 0 ? (
                    <p className="text-gray-400 py-8 text-center">주문 내역이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {ordersData?.orders?.map((order) => {
                        const firstItem = order.items?.[0];
                        const images = firstItem?.product?.images || [];
                        return (
                          <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center gap-4 border p-4 hover:border-gray-400 transition-colors">
                            <img src={getImageUrl(images[0])} alt="" className="w-14 h-18 object-cover bg-gray-50 shrink-0" style={{ height: '4.5rem' }} onError={(e) => { e.target.src = 'https://placehold.co/56x72/f3f4f6/9ca3af?text=IMG'; }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                              <p className="font-medium text-sm mt-0.5 truncate">{firstItem?.snapshot?.name}</p>
                              <p className="text-sm text-gray-600">{formatPrice(order.total)}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 shrink-0 ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                          </Link>
                        );
                      })}
                      <Link to="/orders" className="block text-center text-sm text-gray-500 hover:text-black py-2 underline">
                        전체 주문 내역 보기
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">배송지 관리</h2>
                <button
                  onClick={() => setEditingAddress({})}
                  className="flex items-center gap-1 text-sm btn-secondary px-3 py-2"
                >
                  <Plus size={14} /> 새 배송지
                </button>
              </div>
              {editingAddress && !editingAddress.id && (
                <AddressForm onCancel={() => setEditingAddress(null)} onSave={(data) => saveAddress.mutate(data)} />
              )}
              <div className="space-y-3 mt-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border p-4">
                    {editingAddress?.id === addr.id ? (
                      <AddressForm address={addr} onCancel={() => setEditingAddress(null)} onSave={(data) => saveAddress.mutate(data)} />
                    ) : (
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{addr.name}</span>
                            {addr.isDefault && <span className="text-xs bg-black text-white px-1.5 py-0.5">기본</span>}
                          </div>
                          <p className="text-sm text-gray-600">[{addr.zipCode}] {addr.address1} {addr.address2}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{addr.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingAddress(addr)} className="p-1 hover:text-black text-gray-400 transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => deleteMutation.mutate(addr.id)} className="p-1 hover:text-red-500 text-gray-400 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {addresses.length === 0 && !editingAddress && (
                  <p className="text-gray-400 text-center py-8">등록된 배송지가 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h2 className="text-lg font-bold mb-5">비밀번호 변경</h2>
              <PasswordForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
