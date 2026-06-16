# HAVIT 패션 쇼핑몰

실제 배포 가능한 풀스택 패션 쇼핑몰입니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 백엔드 | Node.js + Express + Prisma ORM + SQLite |
| 프론트엔드 | React 18 + Vite + Tailwind CSS |
| 상태관리 | Zustand + TanStack Query |
| 인증 | JWT (Access + Refresh Token) |
| 결제 | PortOne (구 아임포트) |

## 빠른 시작

### 1. 백엔드 실행
```bash
cd backend
npm install
npm run db:push      # DB 스키마 생성
npm run db:seed      # 초기 데이터 생성
npm run dev          # 개발 서버 실행 (포트 5000)
```

### 2. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev          # 개발 서버 실행 (포트 3000)
```

### 3. 접속
- 쇼핑몰: http://localhost:3000
- 어드민: http://localhost:3000/admin

## 계정 정보

| 구분 | 이메일 | 비밀번호 |
|------|--------|----------|
| 어드민 | admin@shop.kr | admin123! |
| 일반 | test@shop.kr | user123! |

## PortOne 결제 설정

1. [PortOne 관리자](https://admin.portone.io) 회원가입
2. `backend/.env` 파일에 키 입력:
   ```
   IMP_CODE="imp_XXXXXXXX"
   IMP_KEY="your_api_key"
   IMP_SECRET="your_api_secret"
   ```
3. `frontend/index.html`의 IMP.init() 코드에 가맹점 식별코드 적용
4. `frontend/src/pages/Checkout.jsx`에서 `VITE_IMP_CODE` 환경변수 설정

## 카카오 주소 검색 설정

결제/마이페이지에서 주소 검색을 사용하려면:
- `frontend/index.html`에 카카오 주소 스크립트 추가:
  ```html
  <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  ```

## 주요 기능

### 사용자
- 회원가입/로그인 (JWT 자동 갱신)
- 비회원 구매 지원
- 상품 검색 및 필터링 (카테고리, 가격, 정렬)
- 색상/사이즈 옵션 선택
- 실시간 재고 표시 (품절임박 경고)
- 장바구니 (비회원도 유지, 로그인 시 자동 병합)
- 무료배송 진행 표시 바
- PortOne 결제 (카드, 카카오페이, 토스페이, 네이버페이)
- 저장된 배송지 선택
- 카카오 주소 검색 연동
- 주문 상태 타임라인
- 주문 취소 (결제 자동 취소 포함)
- 리뷰 작성 (별점 + 텍스트 + 이미지)
- 마이페이지 (주문내역, 배송지 관리, 비밀번호 변경)

### 관리자
- 대시보드 (주문 현황, 매출)
- 상품 등록/수정/삭제 (이미지 업로드, 옵션/재고 관리)
- 주문 상태 변경

## UX 개선 사항 (기존 쇼핑몰 불편사항 해결)

| 문제 | 해결 |
|------|------|
| 느린 검색 | 실시간 검색 + URL 파라미터 상태 관리 |
| 복잡한 결제 | 3단계 간편 결제 |
| 비회원 구매 불가 | 비회원 주문/결제 지원 |
| 재고 정보 불명확 | 실시간 재고 배지 + 옵션별 재고 |
| 장바구니 휘발 | 비로그인 상태에서도 영구 유지 (세션) |
| 주소 입력 복잡 | 카카오 주소 API 연동 |
| 배송 추적 어려움 | 주문 상태 타임라인 시각화 |
| 모바일 최적화 부족 | 모바일 퍼스트 반응형 디자인 |
| 이미지 확인 어려움 | 호버 시 두 번째 이미지 + 줌 기능 |

## 프로덕션 배포 (PostgreSQL로 전환)

```bash
# backend/.env 변경
DATABASE_URL="postgresql://user:password@localhost:5432/shop"

# 마이그레이션
npm run db:push
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/products | 상품 목록 |
| GET | /api/products/:id | 상품 상세 |
| GET | /api/cart | 장바구니 조회 |
| POST | /api/cart/items | 장바구니 추가 |
| POST | /api/orders | 주문 생성 |
| POST | /api/orders/verify-payment | 결제 검증 |
