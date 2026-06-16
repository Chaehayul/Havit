const prisma = require('../lib/prisma');

const subscribeRestock = async (req, res) => {
  try {
    const { productId, variantId, email } = req.body;
    if (!productId || !email) return res.status(400).json({ message: '상품 ID와 이메일이 필요합니다.' });

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

    const userId = req.user?.id || null;

    const alert = await prisma.restockAlert.upsert({
      where: { email_productId_variantId: { email, productId, variantId: variantId || null } },
      update: { notified: false, userId },
      create: { email, productId, variantId: variantId || null, userId },
    });

    res.status(201).json({ message: '재입고 알림이 등록되었습니다.', alert });
  } catch (error) {
    console.error('subscribeRestock error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const unsubscribeRestock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일이 필요합니다.' });

    await prisma.restockAlert.deleteMany({ where: { email, productId } });
    res.json({ message: '재입고 알림이 취소되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// Admin: notify users when stock is updated (called internally from variant stock update)
const notifyRestockSubscribers = async (productId, variantId) => {
  try {
    const alerts = await prisma.restockAlert.findMany({
      where: { productId, notified: false, OR: [{ variantId }, { variantId: null }] },
      include: { product: { select: { name: true } } },
    });

    if (alerts.length === 0) return;

    // Mark as notified (actual email sending would be added here with nodemailer)
    await prisma.restockAlert.updateMany({
      where: { id: { in: alerts.map((a) => a.id) } },
      data: { notified: true },
    });

    console.log(`📬 재입고 알림 ${alerts.length}명 발송: ${alerts[0]?.product?.name}`);
    return alerts.length;
  } catch (error) {
    console.error('notifyRestockSubscribers error:', error);
  }
};

module.exports = { subscribeRestock, unsubscribeRestock, notifyRestockSubscribers };
