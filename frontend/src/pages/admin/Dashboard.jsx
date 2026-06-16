import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { orderApi } from '../../api/order.api';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/format';
import { PageSpinner } from '../../components/common/Spinner';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => orderApi.getAdminStats({ days: 30, lowStock: 5 }),
  });

  if (isLoading) return <PageSpinner />;

  const summary = data?.summary || {};
  const stats = [
    { label: '전체 주문', value: summary.totalOrders || 0, icon: ShoppingCart, link: '/admin/orders', color: 'bg-blue-50 text-blue-600' },
    { label: '전체 상품', value: summary.totalProducts || 0, icon: Package, link: '/admin/products', color: 'bg-green-50 text-green-600' },
    { label: '전체 회원', value: summary.totalUsers || 0, icon: Users, link: '/admin/orders', color: 'bg-purple-50 text-purple-600' },
    { label: '최근 30일 매출', value: formatPrice(summary.periodRevenue || 0), icon: TrendingUp, link: '/admin/orders', color: 'bg-orange-50 text-orange-600' },
  ];

  const recentDaily = data?.daily?.slice(-7) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-gray-500">누적 매출 {formatPrice(summary.totalRevenue || 0)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link} className="border p-5 hover:border-gray-400 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <section className="border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} />
            <h2 className="font-bold">최근 7일 주문/매출</h2>
          </div>
          <div className="space-y-3">
            {recentDaily.map((day) => {
              const maxRevenue = Math.max(...recentDaily.map((d) => d.revenue), 1);
              const width = Math.max((day.revenue / maxRevenue) * 100, day.orders > 0 ? 8 : 0);
              return (
                <div key={day.date} className="grid grid-cols-[5.5rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="text-gray-500">{day.date.slice(5)}</span>
                  <div className="h-2 bg-gray-100">
                    <div className="h-full bg-black" style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-right">{day.orders}건</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border p-5">
          <h2 className="font-bold mb-4">주문 상태</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
              <Link
                key={status}
                to={`/admin/orders?status=${status}`}
                className={`flex items-center justify-between px-3 py-2 text-sm ${ORDER_STATUS_COLORS[status] || 'bg-gray-50'}`}
              >
                <span>{label}</span>
                <strong>{data?.statusCounts?.[status] || 0}</strong>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <section className="border p-5">
          <h2 className="font-bold mb-4">상품별 판매량</h2>
          <div className="divide-y">
            {data?.topProducts?.map((product) => (
              <Link key={product.id} to={`/admin/products/${product.id}`} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-gray-400">{formatPrice(product.price)}</p>
                </div>
                <strong>{product.salesCount}개</strong>
              </Link>
            ))}
            {data?.topProducts?.length === 0 && <p className="py-6 text-center text-sm text-gray-400">판매 데이터가 없습니다.</p>}
          </div>
        </section>

        <section className="border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            <h2 className="font-bold">재고 부족 상품</h2>
          </div>
          <div className="divide-y">
            {data?.lowStockVariants?.map((variant) => (
              <Link key={variant.id} to={`/admin/products/${variant.product.id}`} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{variant.product.name}</p>
                  <p className="text-xs text-gray-400">{Object.values(variant.options || {}).join(' / ') || variant.sku}</p>
                </div>
                <strong className={variant.stock === 0 ? 'text-red-600' : 'text-orange-600'}>{variant.stock}개</strong>
              </Link>
            ))}
            {data?.lowStockVariants?.length === 0 && <p className="py-6 text-center text-sm text-gray-400">재고 부족 상품이 없습니다.</p>}
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">최근 주문</h2>
          <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-black underline">전체 보기</Link>
        </div>
        <div className="border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">주문번호</th>
                <th className="text-left px-4 py-3 font-medium">주문자</th>
                <th className="text-left px-4 py-3 font-medium">금액</th>
                <th className="text-left px-4 py-3 font-medium">상태</th>
                <th className="text-left px-4 py-3 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-mono text-xs hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.user?.name || order.guestName || '비회원'}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">주문이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
