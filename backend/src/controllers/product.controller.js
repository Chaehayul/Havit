const prisma = require('../lib/prisma');

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort = 'createdAt_desc',
      minPrice,
      maxPrice,
      featured,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where = { isActive: true };

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) {
        const childIds = await prisma.category
          .findMany({ where: { parentId: cat.id } })
          .then((children) => children.map((c) => c.id));
        where.categoryId = { in: [cat.id, ...childIds] };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (featured === 'true') where.isFeatured = true;

    const [field, direction] = sort.split('_');
    const orderBy = {};
    if (field === 'price') orderBy.price = direction === 'asc' ? 'asc' : 'desc';
    else if (field === 'sales') orderBy.salesCount = 'desc';
    else orderBy.createdAt = direction === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { select: { id: true, sku: true, options: true, stock: true, price: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      tags: JSON.parse(p.tags || '[]'),
      variants: p.variants.map((v) => ({ ...v, options: JSON.parse(v.options || '{}') })),
      avgRating: p.reviews.length
        ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
        : 0,
      reviewCount: p.reviews.length,
      reviews: undefined,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true },
      include: {
        category: { include: { parent: true } },
        options: { include: { values: true }, orderBy: { sortOrder: 'asc' } },
        variants: true,
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

    const avgRating = product.reviews.length
      ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
      : 0;

    res.json({
      ...product,
      images: JSON.parse(product.images || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      variants: product.variants.map((v) => ({
        ...v,
        options: JSON.parse(v.options || '{}'),
      })),
      reviews: product.reviews.map((r) => ({
        ...r,
        images: JSON.parse(r.images || '[]'),
      })),
      avgRating,
      reviewCount: product.reviews.length,
      totalStock: product.variants.reduce((s, v) => s + v.stock, 0),
    });
  } catch (error) {
    console.error('getProduct error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, comparePrice, images, categoryId, options, variants, tags, isFeatured } =
      req.body;

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        images: JSON.stringify(images || []),
        categoryId,
        tags: JSON.stringify(tags || []),
        isFeatured: isFeatured || false,
        options: {
          create: (options || []).map((opt, idx) => ({
            name: opt.name,
            sortOrder: idx,
            values: {
              create: opt.values.map((val) => ({
                value: val.value,
                color: val.color || null,
              })),
            },
          })),
        },
        variants: {
          create: (variants || []).map((v) => ({
            sku: v.sku,
            options: JSON.stringify(v.options),
            stock: Number(v.stock) || 0,
            price: v.price ? Number(v.price) : null,
          })),
        },
      },
      include: {
        category: true,
        options: { include: { values: true } },
        variants: true,
      },
    });

    res.status(201).json({
      ...product,
      images: JSON.parse(product.images),
      tags: JSON.parse(product.tags),
      variants: product.variants.map((v) => ({ ...v, options: JSON.parse(v.options) })),
    });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, comparePrice, images, categoryId, tags, isFeatured, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: Number(price) }),
        ...(comparePrice !== undefined && { comparePrice: comparePrice ? Number(comparePrice) : null }),
        ...(images && { images: JSON.stringify(images) }),
        ...(categoryId && { categoryId }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ ...product, images: JSON.parse(product.images), tags: JSON.parse(product.tags) });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: '상품이 비활성화되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateVariantStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const variant = await prisma.variant.update({
      where: { id: req.params.variantId },
      data: { stock: Number(stock) },
    });
    res.json({ ...variant, options: JSON.parse(variant.options) });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateVariantStock };
