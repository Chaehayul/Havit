import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
      toast.success('로그인되었습니다.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold tracking-widest">HAVIT</Link>
          <p className="text-gray-500 mt-2 text-sm">로그인하고 나만의 쇼핑 경험을 이어가세요.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-8 border">
          <div>
            <label className="block text-sm font-medium mb-1.5">이메일</label>
            <input
              {...register('email', {
                required: '이메일을 입력해주세요.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일을 입력해주세요.' },
              })}
              type="email"
              autoComplete="email"
              className={`input-base ${errors.email ? 'input-error' : ''}`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                {...register('password', { required: '비밀번호를 입력해주세요.' })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input-base pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="비밀번호"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 text-base font-bold mt-2"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-y-3">
          <p className="text-gray-500">
            아직 계정이 없으신가요?{' '}
            <Link to="/register" className="font-bold text-black hover:underline">
              회원가입
            </Link>
          </p>
          <p>
            <Link to="/checkout" className="text-gray-500 hover:text-black transition-colors">
              비회원으로 구매하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
