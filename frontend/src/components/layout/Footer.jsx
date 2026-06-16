import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="font-bold text-sm mb-3">고객센터</h3>
            <p className="text-2xl font-bold mb-1">1234-5678</p>
            <p className="text-xs text-gray-500">평일 10:00 - 18:00</p>
            <p className="text-xs text-gray-500">점심 12:30 - 13:30</p>
            <p className="text-xs text-gray-500">주말·공휴일 휴무</p>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">쇼핑 안내</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/products" className="hover:text-black">전체 상품</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-black">신상품</Link></li>
              <li><Link to="/products?sort=sales_desc" className="hover:text-black">베스트</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">이용 안내</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-black">배송 정책</a></li>
              <li><a href="#" className="hover:text-black">교환/반품</a></li>
              <li><a href="#" className="hover:text-black">사이즈 가이드</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3">HAVIT</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-black">브랜드 소개</a></li>
              <li><a href="#" className="hover:text-black">개인정보처리방침</a></li>
              <li><a href="#" className="hover:text-black">이용약관</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t text-xs text-gray-400">
          <p className="mb-1">
            상호명: 하빗 주식회사 | 대표: 채하율 | 사업자등록번호: 000-00-00000
          </p>
          <p className="mb-1">주소: 서울특별시 강남구 테헤란로 00길 00</p>
          <p className="mb-3">이메일: help@havit.kr | 통신판매업신고번호: 제0000-서울강남-0000호</p>
          <p>© 2024 HAVIT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
