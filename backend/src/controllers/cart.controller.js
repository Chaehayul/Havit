const prisma = require('../lib/prisma');

const getOrCreateCart = async (userId, sessionId) => {
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { variants: true } } } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { include: { variants: true } } } } },
      });
    }
    return cart;
  }
  if (sessionId) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: { include: { product: { include: { variants: true } } } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: { items: { include: { product: { include: { variants: true } } } } },
      });
    }
    return cart;
  }
  throw new Error('인증 또는 세션이 필요합니다.');
};

const formatCart = (cart) => ({
  ...cart,
  items: cart.items.map((item) => ({
    ...item,
    options: item.options ? JSON.parse(item.options) : null,
    product: {
      ...item.product,
      images: JSON.parse(item.product.images || '[]'),
      variants: item.product.variants.map((v) => ({ ...v, options: JSON.parse(v.options || '{}') })),
    },
  })),
});

const getCart = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.user?.id, sessionId);
    res.json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const addItem = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1, options } = req.body;
    if (!productId) return res.status(400).json({ message: '상품 ID가 필요합니다.' });

    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.user?.id, sessionId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product || !product.isActive) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant || variant.stock < quantity) {
        return res.status(400).json({ message: '재고가 부족합니다.' });
      }
    }

    const optionsKey = options ? JSON.stringify(options) : null;
    const existing = cart.items.find(
      (i) => i.productId === productId && i.variantId === (variantId || null)
    );

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + Number(quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity: Number(quantity),
          options: optionsKey,
        },
      });
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

    const updatedCart = await getOrCreateCart(req.user?.id, sessionId);
    res.json(formatCart(updatedCart));
  } catch (error) {
    console.error('addItem error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: req.params.itemId },
        data: { quantity: Number(quantity) },
      });
    }

    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.user?.id, sessionId);
    res.json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const removeItem = async (req, res) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.user?.id, sessionId);
    res.json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const clearCart = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.user?.id, sessionId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ message: '장바구니가 비워졌습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 비회원 → 회원 장바구니 병합
const mergeCart = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ message: '병합할 장바구니가 없습니다.' });

    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return res.json({ message: '병합할 항목이 없습니다.' });

    let userCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: true },
    });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId: req.user.id }, include: { items: true } });
    }

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (i) => i.productId === guestItem.productId && i.variantId === guestItem.variantId
      );
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
            options: guestItem.options,
          },
        });
      }
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: { include: { variants: true } } } } },
    });
    res.json(formatCart(updatedCart));
  } catch (error) {
    console.error('mergeCart error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };
