const prisma = require('../lib/prisma');

const getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            variants: { select: { id: true, stock: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map(({ product, createdAt, id }) => ({
      wishlistId: id,
      addedAt: createdAt,
      ...product,
      images: JSON.parse(product.images || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      totalStock: product.variants.reduce((s, v) => s + v.stock, 0),
      avgRating: product.reviews.length
        ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
        : 0,
      reviewCount: product.reviews.length,
      reviews: undefined,
      variants: undefined,
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error('getWishlist error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: '상품 ID가 필요합니다.' });

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
    });

    res.status(201).json({ message: '위시리스트에 추가되었습니다.', item });
  } catch (error) {
    console.error('addToWishlist error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId },
    });
    res.json({ message: '위시리스트에서 제거되었습니다.' });
  } catch (error) {
    console.error('removeFromWishlist error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    res.json({ isWishlisted: !!item });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };
