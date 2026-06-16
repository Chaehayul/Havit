import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cartApi } from '../api/cart.api';
import { orderApi } from '../api/order.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/auth.store';
import { formatPrice, getImageUrl } from '../utils/format';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

const PAYMENT_METHODS = [
  { id: 'card', label: '신용카드', pg: 'html5_inicis' },
  { id: 'kakaopay', label: '카카오페이', pg: 'kakaopay' },
  { id: 'tosspay', label: '토스페이', pg: 'tosspay' },
  { id: 'naverpay', label: '네이버페이', pg: 'naverpay' },
];

export default function Checkout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 배송지, 2: 결제
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useNewAddress, setUseNewAddress] = useState(true);

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      zipCode: '',
      address1: '',
      address2: '',
      memo: '',
    },
  });

  useEffect(() => {
    if (user) {
      userApi.getAddresses().then((addresses) => {
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const def = addresses.find((a) => a.isDefault) || addresses[0];
          setValue('name', def.name);
          setValue('phone', def.phone);
          setValue('zipCode', def.zipCode);
          setValue('address1', def.address1);
          setValue('address2', def.address2 || '');
          setUseNewAddress(false);
        }
      }).catch(() => {});
    }
  }, [user]);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.variants?.find((v) => v.id === item.variantId)?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (cartLoading) return <PageSpinner />;
  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-lg mb-4">장바구니가 비어있습니다.</p>
        <Link to="/products" className="btn-primary px-8 py-3">쇼핑하기</Link>
      </div>
    );
  }

  const openKakaoPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setValue('zipCode', data.zonecode);
        setValue('address1', data.address);
      },
    }).open();
  };

  const onSubmit = async (formData) => {
    if (step === 1) { setStep(2); return; }

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        variantId: item.variantId,
        quantity: item.quantity,
        options: item.options,
      }));

      const order = await orderApi.createOrder({
        items: orderItems,
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          zipCode: formData.zipCode,
          address1: formData.address1,
          address2: formData.address2,
          memo: formData.memo,
        },
        guestEmail: !user ? formData.email : undefined,
        guestName: !user ? formData.name : undefined,
        guestPhone: !user ? formData.phone : undefined,
      });

      const IMP = window.IMP;
      if (!IMP) {
        toast.error('결제 모듈을 불러오는 데 실패했습니다.');
        return;
      }

      const impCode = import.meta.env.VITE_IMP_CODE;
      if (!impCode) {
        toast.error('결제 가맹점 코드가 설정되지 않았습니다.');
        return;
      }
      IMP.init(impCode);

      const paymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

      IMP.request_pay(
        {
          pg: paymentMethod.pg,
          pay_method: selectedPayment === 'card' ? 'card' : selectedPayment,
          merchant_uid: order.merchantUid,
          name: items.length === 1 ? items[0].product.name : `${items[0].product.name} 외 ${items.length - 1}건`,
          amount: order.total,
          buyer_email: user?.email || formData.email,
          buyer_name: user?.name || formData.name,
          buyer_tel: user?.phone || formData.phone,
          buyer_addr: `${formData.address1} ${formData.address2}`,
          buyer_postcode: formData.zipCode,
        },
        async (rsp) => {
          if (rsp.success) {
            try {
              await orderApi.verifyPayment({ impUid: rsp.imp_uid, orderId: order.id });
              navigate(`/orders/${order.id}?success=true`);
            } catch (err) {
              toast.error(err.response?.data?.message || '결제 검증에 실패했습니다.');
            }
          } else {
            if (rsp.error_msg !== '사용자가 결제를 취소하셨습니다') {
              toast.error(`결제 실패: ${rsp.error_msg}`);
            }
          }
        }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || '주문 생성에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">주문/결제</h1>

      {/* 단계 표시 */}
      <div className="flex items-center gap-3 mb-10 text-sm">
        <span className={`font-bold ${step === 1 ? 'text-black' : 'text-gray-400'}`}>1. 배송 정보</span>
        <ChevronRight size={14} className="text-gray-300" />
        <span className={`font-bold ${step === 2 ? 'text-black' : 'text-gray-400'}`}>2. 결제</span>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-400">3. 완료</span>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-8">
          {/* Step 1: 배송 정보 */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-lg mb-5">배송 정보</h2>

              {/* 저장된 주소 */}
              {savedAddresses.length > 0 && (
                <div className="mb-6 space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                        !useNewAddress && watch('zipCode') === addr.zipCode ? 'border-black bg-gray-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="mt-0.5"
                        onChange={() => {
                          setUseNewAddress(false);
                          setValue('name', addr.name);
                          setValue('phone', addr.phone);
                          setValue('zipCode', addr.zipCode);
                          setValue('address1', addr.address1);
                          setValue('address2', addr.address2 || '');
                        }}
                        defaultChecked={addr.isDefault}
                      />
                      <div>
                        <p className="font-medium text-sm">{addr.name} {addr.isDefault && <span className="ml-1 text-xs text-blue-600">[기본]</span>}</p>
                        <p className="text-sm text-gray-600">[{addr.zipCode}] {addr.address1} {addr.address2}</p>
                        <p className="text-xs text-gray-400">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className="text-sm underline text-gray-500 hover:text-black"
                  >
                    + 새 배송지 입력
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {!user && (
                  <div>
                    <label className="block text-sm font-medium mb-1">이메일 <span className="text-red-500">*</span></label>
                    <input
                      {...register('email', { required: '이메일을 입력해주세요.' })}
                      type="email"
                      className={`input-base ${errors.email ? 'input-error' : ''}`}
                      placeholder="주문 확인 이메일"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">받는 분 <span className="text-red-500">*</span></label>
                    <input {...register('name', { required: '이름을 입력해주세요.' })} className={`input-base ${errors.name ? 'input-error' : ''}`} placeholder="이름" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처 <span className="text-red-500">*</span></label>
                    <input {...register('phone', { required: '연락처를 입력해주세요.' })} className={`input-base ${errors.phone ? 'input-error' : ''}`} placeholder="010-0000-0000" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mb-2">
                    <input
                      {...register('zipCode', { required: '주소를 검색해주세요.' })}
                      readOnly
                      placeholder="우편번호"
                      className={`input-base flex-1 bg-gray-50 cursor-pointer ${errors.zipCode ? 'input-error' : ''}`}
                      onClick={openKakaoPostcode}
                    />
                    <button
                      type="button"
                      onClick={openKakaoPostcode}
                      className="btn-secondary px-4 text-sm whitespace-nowrap"
                    >
                      주소 검색
                    </button>
                  </div>
                  <input {...register('address1')} readOnly className="input-base bg-gray-50 mb-2" placeholder="기본 주소" />
                  <input {...register('address2')} className="input-base" placeholder="상세 주소 (동, 호수 등)" />
                  {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">배송 메모</label>
                  <select {...register('memo')} className="input-base">
                    <option value="">선택하세요</option>
                    <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                    <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
                    <option value="택배함에 넣어주세요">택배함에 넣어주세요</option>
                    <option value="직접 수령">직접 수령</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-4 mt-8 text-base font-bold">
                결제 방법 선택 →
              </button>
            </div>
          )}

          {/* Step 2: 결제 방법 */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-black underline">
                  ← 배송 정보 수정
                </button>
                <h2 className="font-bold text-lg">결제 방법</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                      selectedPayment === method.id ? 'border-black bg-gray-50 font-medium' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={() => setSelectedPayment(method.id)}
                    />
                    {method.label}
                  </label>
                ))}
              </div>

              <div className="bg-gray-50 p-4 text-sm text-gray-600 mb-8 space-y-1">
                <p>• 주문 내용을 확인하였으며 구매에 동의합니다.</p>
                <p>• 개인정보 수집/이용 및 제3자 제공에 동의합니다.</p>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-4 text-base font-bold"
              >
                {formatPrice(total)} 결제하기
              </button>
            </div>
          )}
        </form>

        {/* 주문 요약 */}
        <div className="mt-8 lg:mt-0">
          <div className="border p-5 sticky top-24">
            <h3 className="font-bold mb-4">주문 상품 ({items.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((item) => {
                const price = item.product.variants?.find((v) => v.id === item.variantId)?.price || item.product.price;
                const images = item.product.images || [];
                return (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={getImageUrl(images[0])}
                      alt={item.product.name}
                      className="w-14 h-18 object-cover bg-gray-50 shrink-0"
                      style={{ height: '4.5rem' }}
                      onError={(e) => { e.target.src = 'https://placehold.co/56x72/f3f4f6/9ca3af?text=IMG'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      {item.options && (
                        <p className="text-xs text-gray-400">{Object.values(item.options).join('/')}</p>
                      )}
                      <p className="text-sm font-bold mt-1">{formatPrice(price)} × {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span>{shippingFee === 0 ? <span className="text-green-600">무료</span> : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>총 결제금액</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
