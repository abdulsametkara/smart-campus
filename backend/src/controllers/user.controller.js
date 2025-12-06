const { Op } = require('sequelize');
const { User, Student, Faculty } = require('../../models');
const { hashPassword, comparePassword } = require('../utils/password');

const serializeUser = (userInstance) => {
  if (!userInstance) return null;

  const plain = userInstance.get({ plain: true });
  const base = {
    id: plain.id,
    email: plain.email,
    full_name: plain.full_name,
    phone_number: plain.phone_number,
    role: plain.role,
    profile_picture_url: plain.profile_picture_url,
    created_at: plain.created_at,
    updated_at: plain.updated_at,
  };

  if (plain.studentProfile) {
    base.student = {
      student_number: plain.studentProfile.student_number,
      department_id: plain.studentProfile.department_id,
      gpa: plain.studentProfile.gpa,
      cgpa: plain.studentProfile.cgpa,
    };
  }

  if (plain.facultyProfile) {
    base.faculty = {
      employee_number: plain.facultyProfile.employee_number,
      title: plain.facultyProfile.title,
      department_id: plain.facultyProfile.department_id,
    };
  }

  return base;
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Student, as: 'studentProfile', attributes: ['student_number', 'department_id', 'gpa', 'cgpa'] },
        { model: Faculty, as: 'facultyProfile', attributes: ['employee_number', 'title', 'department_id'] },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(serializeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateMe = async (req, res) => {
  try {
    const { full_name, phone_number } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (full_name !== undefined) user.full_name = full_name;
    if (phone_number !== undefined) user.phone_number = phone_number;

    await user.save();

    return res.json(serializeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profile_picture_url = `/uploads/${req.file.filename}`;
    await user.save();

    return res.json({ profile_picture_url: user.profile_picture_url });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { role, search, departmentId } = req.query;

    const where = {};
    const andConditions = [];

    if (role) {
      where.role = role;
    }

    if (search) {
      andConditions.push({
        [Op.or]: [
          { email: { [Op.iLike]: `%${search}%` } },
          { full_name: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    if (departmentId) {
      andConditions.push({
        [Op.or]: [
          { '$studentProfile.department_id$': Number(departmentId) },
          { '$facultyProfile.department_id$': Number(departmentId) },
        ],
      });
    }

    if (andConditions.length) {
      where[Op.and] = andConditions;
    }

    const result = await User.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'studentProfile', attributes: ['student_number', 'department_id', 'gpa', 'cgpa'] },
        { model: Faculty, as: 'facultyProfile', attributes: ['employee_number', 'title', 'department_id'] },
      ],
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(result.count / limit);

    return res.json({
      data: result.rows.map(serializeUser),
      meta: {
        page,
        limit,
        total: result.count,
        totalPages,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Mevcut şifre ve yeni şifre gerekli' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalı' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const isMatch = await comparePassword(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    user.password_hash = await hashPassword(new_password);
    await user.save();

    return res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: `Sunucu hatası: ${err.message}` });
  }
};

module.exports = {
  getMe,
  updateMe,
  uploadProfilePicture,
  listUsers,
  changePassword,
};
