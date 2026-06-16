const prisma = require('../lib/prisma');
const { getPaymentInfo, cancelPayment } = require('../lib/iamport');
const { v4: uuidv4 } = require('uuid');

const PAID_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];
const VALID_STATUSES = ['PENDING', ...PAID_STATUSES, 'CANCELLED', 'REFUNDED'];

const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
};

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const parseOrder = (order) => ({
  ...order,
  shippingAddress: parseJson(order.shippingAddress, {}),
  items: order.items?.map((item) => ({
    ...item,
    snapshot: parseJson(item.snapshot, {}),
    options: parseJson(item.options, null),
    product: item.product?.images
      ? { ...item.product, images: parseJson(item.product.images, []) }
      : item.product,
  })),
});

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, guestEmail, guestName, guestPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: '주문 항목이 없습니다.' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: '배송지 정보가 필요합니다.' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `상품을 찾을 수 없습니다: ${item.productId}` });
      }

      let price = product.price;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) return res.status(400).json({ message: '옵션을 찾을 수 없습니다.' });
        if (variant.stock < item.quantity) {
          return res.status(400).json({ message: `재고가 부족합니다: ${product.name}` });
        }
        if (variant.price) price = variant.price;
      }

      subtotal += price * item.quantity;
      orderItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price,
        options: item.options ? JSON.stringify(item.options) : null,
        snapshot: JSON.stringify({
          name: product.name,
          image: parseJson(product.images, [])[0] || null,
          options: item.options,
        }),
      });
    }

    const shippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || 50000;
    const shippingFeeAmount = Number(process.env.SHIPPING_FEE) || 3000;
    const shippingFee = subtotal >= shippingThreshold ? 0 : shippingFeeAmount;
    const total = subtotal + shippingFee;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user?.id || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        subtotal,
        shippingFee,
        total,
        shippingAddress: JSON.stringify(shippingAddress),
        merchantUid: uuidv4(),
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    res.status(201).json(parseOrder(order));
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { impUid, orderId } = req.body;
    if (!impUid || !orderId) {
      return res.status(400).json({ message: '결제 정보가 필요합니다.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    if (order.status !== 'PENDING' || order.paymentId) {
      return res.status(409).json({ message: '이미 처리된 주문입니다.' });
    }

    const paymentInfo = await getPaymentInfo(impUid);
    const duplicatePayment = await prisma.order.findFirst({
      where: { paymentId: impUid, NOT: { id: orderId } },
    });
    if (duplicatePayment) {
      return res.status(409).json({ message: '이미 사용된 결제 정보입니다.' });
    }

    if (paymentInfo.amount !== order.total) {
      await cancelPayment(impUid, '결제 금액 불일치');
      return res.status(400).json({ message: '결제 금액이 일치하지 않습니다.' });
    }
    if (paymentInfo.status !== 'paid') {
      return res.status(400).json({ message: '결제가 완료되지 않았습니다.' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const locked = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING', paymentId: null },
        data: {
          status: 'PAID',
          paymentId: impUid,
          paymentMethod: paymentInfo.pay_method,
          paidAt: new Date(),
        },
      });
      if (locked.count !== 1) throw new Error('ORDER_ALREADY_PROCESSED');

      const orderItems = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of orderItems) {
        if (item.variantId) {
          const stockUpdate = await tx.variant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (stockUpdate.count !== 1) throw new Error('OUT_OF_STOCK');
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } },
        });
      }

      if (req.user) {
        const cart = await tx.cart.findUnique({ where: { userId: req.user.id } });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: { select: { id: true, name: true, images: true } } } } },
      });
    });

    res.json(parseOrder(updatedOrder));
  } catch (error) {
    console.error('verifyPayment error:', error);
    if (error.message === 'OUT_OF_STOCK') {
      await cancelPayment(req.body.impUid, '재고 부족').catch(() => {});
      return res.status(409).json({ message: '결제 중 재고가 부족해 결제를 취소했습니다.' });
    }
    if (error.message === 'ORDER_ALREADY_PROCESSED') {
      return res.status(409).json({ message: '이미 처리된 주문입니다.' });
    }
    res.status(500).json({ message: '결제 검증에 실패했습니다.' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 1,
            include: { product: { select: { name: true, images: true } } },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map(parseOrder),
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(req.user ? { userId: req.user.id } : {}),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
    });
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });

    res.json(parseOrder(order));
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    if (!['PENDING', 'PAID'].includes(order.status)) {
      return res.status(400).json({ message: '취소할 수 없는 주문 상태입니다.' });
    }

    if (order.paymentId) {
      await cancelPayment(order.paymentId, req.body.reason || '고객 요청');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (order.status === 'PAID') {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
        for (const item of orderItems) {
          if (item.variantId) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { salesCount: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
    });

    res.json({ ...updated, shippingAddress: parseJson(updated.shippingAddress, {}) });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map(parseOrder),
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    const paidWhere = { status: { in: PAID_STATUSES } };
    const paidPeriodWhere = { ...paidWhere, createdAt: { gte: from } };

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      revenueAgg,
      periodRevenueAgg,
      statusCounts,
      recentOrders,
      topProducts,
      lowStockVariants,
      periodOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.aggregate({ where: paidWhere, _sum: { total: true } }),
      prisma.order.aggregate({ where: paidPeriodWhere, _sum: { total: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { salesCount: 'desc' },
        select: { id: true, name: true, salesCount: true, price: true },
      }),
      prisma.variant.findMany({
        where: { stock: { lte: Number(req.query.lowStock) || 5 } },
        take: 10,
        orderBy: { stock: 'asc' },
        include: { product: { select: { id: true, name: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true, total: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const dailyMap = new Map();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, orders: 0, revenue: 0 });
    }
    periodOrders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      const row = dailyMap.get(key);
      if (!row) return;
      row.orders += 1;
      if (PAID_STATUSES.includes(order.status)) row.revenue += order.total;
    });

    res.json({
      summary: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: revenueAgg._sum.total || 0,
        periodRevenue: periodRevenueAgg._sum.total || 0,
        periodDays: days,
      },
      statusCounts: statusCounts.reduce((acc, row) => ({ ...acc, [row.status]: row._count.status }), {}),
      daily: Array.from(dailyMap.values()),
      topProducts,
      lowStockVariants: lowStockVariants.map((variant) => ({
        ...variant,
        options: parseJson(variant.options, {}),
      })),
      recentOrders: recentOrders.map(parseOrder),
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: '관리자 통계를 불러오지 못했습니다.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
    }
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ ...order, shippingAddress: parseJson(order.shippingAddress, {}) });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  getAdminStats,
  updateOrderStatus,
};
