const prisma = require('../lib/prisma');

const REVIEWABLE_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

const parseImages = (images) => {
  try {
    return JSON.parse(images || '[]');
  } catch {
    return [];
  }
};

const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const productId = req.params.productId;

    const [reviews, total, ratingStats, ratingAverage] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
    ]);

    const statsMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((s) => { statsMap[s.rating] = s._count.rating; });
    const avgRating = total > 0 ? Math.round((ratingAverage._avg.rating || 0) * 10) / 10 : 0;

    res.json({
      reviews: reviews.map((r) => ({ ...r, images: parseImages(r.images) })),
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
      stats: { avgRating, total, distribution: statsMap },
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment, images, orderId } = req.body;
    const productId = req.params.productId;

    if (!rating || !comment) {
      return res.status(400).json({ message: '평점과 리뷰 내용을 입력해주세요.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: '평점은 1~5 사이여야 합니다.' });
    }

    const purchasedItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        ...(orderId ? { orderId } : {}),
        order: {
          userId: req.user.id,
          status: { in: REVIEWABLE_STATUSES },
        },
      },
    });
    if (!purchasedItem) {
      return res.status(403).json({ message: '구매 완료한 상품만 리뷰를 작성할 수 있습니다.' });
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId: req.user.id, productId },
    });
    if (existingReview) {
      return res.status(409).json({ message: '이미 리뷰를 작성하셨습니다.' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        orderId: purchasedItem.orderId,
        rating: Number(rating),
        comment,
        images: JSON.stringify(images || []),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json({ ...review, images: parseImages(review.images) });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const review = await prisma.review.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!review) return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: '평점은 1~5 사이여야 합니다.' });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...(rating && { rating: Number(rating) }),
        ...(comment && { comment }),
        ...(images && { images: JSON.stringify(images) }),
      },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ ...updated, images: parseImages(updated.images) });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await prisma.review.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!review) return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview };
