const { User } = require('../models');
const Logger = require('../utils/logger');
const { Op } = require('sequelize');

// Admin only - Register Manager or Admin
const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['Admin', 'Manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for staff registration' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Log the action
    await Logger.logUserAction(
      'STAFF_REGISTERED',
      `Admin ${req.user.email} registered new ${role}: ${email}`,
      req.user.id,
      req
    );

    res.status(201).json({
      message: 'Staff member registered successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Admin only - Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = user.email;
    const userRole = user.role;
    
    await user.destroy();

    // Log the action
    await Logger.logUserAction(
      'USER_DELETED',
      `Admin ${req.user.email} deleted ${userRole} user: ${userEmail}`,
      req.user.id,
      req
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Admin only - Change user role
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['Admin', 'Manager', 'Customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log the action
    await Logger.logUserAction(
      'ROLE_CHANGED',
      `Admin ${req.user.email} changed role for ${user.email} from ${oldRole} to ${role}`,
      req.user.id,
      req
    );

    res.json({
      message: 'User role updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Manager only - Get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      role: 'Customer'
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      customers: rows.map(user => user.toSafeObject()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin only - Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: rows.map(user => user.toSafeObject()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStaff,
  deleteUser,
  changeUserRole,
  getAllCustomers,
  getAllUsers
};