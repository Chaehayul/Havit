import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async ({ email, password, name, phone }) => {
    try {
      await registerUser({ email, password, name, phone });
      toast.success('회원가입이 완료되었습니다! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다.');
    }
  };

  const BENEFITS = ['첫 주문 10% 할인쿠폰 즉시 지급', '신상품 & 세일 알림', '주문/배송 실시간 알림'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold tracking-widest">HAVIT</Link>
          <p className="text-gray-500 mt-2 text-sm">회원가입하고 특별한 혜택을 받아보세요</p>
        </div>

        {/* 혜택 */}
        <div className="bg-black text-white p-4 mb-6 space-y-1.5">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} className="text-green-400 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-8 border">
          <div>
            <label className="block text-sm font-medium mb-1.5">이름 <span className="text-red-500">*</span></label>
            <input
              {...register('name', { required: '이름을 입력해주세요.', minLength: { value: 2, message: '이름은 2자 이상이어야 합니다.' } })}
              className={`input-base ${errors.name ? 'input-error' : ''}`}
              placeholder="홍길동"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">이메일 <span className="text-red-500">*</span></label>
            <input
              {...register('email', {
                required: '이메일을 입력해주세요.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일을 입력해주세요.' },
              })}
              type="email"
              className={`input-base ${errors.email ? 'input-error' : ''}`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">휴대폰 번호</label>
            <input
              {...register('phone')}
              type="tel"
              className="input-base"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">비밀번호 <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                {...register('password', {
                  required: '비밀번호를 입력해주세요.',
                  minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                })}
                type={showPassword ? 'text' : 'password'}
                className={`input-base pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="8자 이상"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">비밀번호 확인 <span className="text-red-500">*</span></label>
            <input
              {...register('passwordConfirm', {
                required: '비밀번호를 한 번 더 입력해주세요.',
                validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
              })}
              type="password"
              className={`input-base ${errors.passwordConfirm ? 'input-error' : ''}`}
              placeholder="비밀번호 확인"
            />
            {errors.passwordConfirm && <p className="text-red-500 text-xs mt-1">{errors.passwordConfirm.message}</p>}
          </div>

          <p className="text-xs text-gray-400">
            회원가입 시{' '}
            <a href="#" className="underline hover:text-black">이용약관</a>{' '}및{' '}
            <a href="#" className="underline hover:text-black">개인정보처리방침</a>에 동의하게 됩니다.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 text-base font-bold"
          >
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-bold text-black hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
