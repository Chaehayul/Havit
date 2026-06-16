const prisma = require('../lib/prisma');

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        parent: true,
      },
    });
    if (!category) return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, image, parentId, sortOrder } = req.body;
    if (!name || !slug) return res.status(400).json({ message: '이름과 슬러그는 필수입니다.' });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ message: '이미 사용 중인 슬러그입니다.' });

    const category = await prisma.category.create({
      data: { name, slug, image, parentId: parentId || null, sortOrder: sortOrder || 0 },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, image, sortOrder } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, image, sortOrder },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (productCount > 0) {
      return res.status(400).json({ message: '해당 카테고리에 상품이 존재합니다.' });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
