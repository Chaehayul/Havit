const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const getProfile = async (req, res) => {
  const { password, refreshToken, ...user } = req.user;
  res.json(user);
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }) },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: '새 비밀번호는 8자 이상이어야 합니다.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const createAddress = async (req, res) => {
  try {
    const { name, phone, zipCode, address1, address2, isDefault } = req.body;
    if (!name || !phone || !zipCode || !address1) {
      return res.status(400).json({ message: '필수 주소 정보를 입력해주세요.' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { userId: req.user.id, name, phone, zipCode, address1, address2, isDefault: isDefault || false },
    });
    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { name, phone, zipCode, address1, address2, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { name, phone, zipCode, address1, address2, isDefault: isDefault || false },
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: '주소가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 어드민 전용
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);
    res.json({ users, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, getAddresses, createAddress, updateAddress, deleteAddress, getUsers };
