const jwt = require('jsonwebtoken');
const { User } = require('../models');
const Logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user (password will be hashed by the model hook)
    const user = await User.create({
      name,
      email,
      password,
      role: 'Customer' // Default role for public registration
    });

    // Log the registration
    await Logger.logUserAction(
      'USER_REGISTERED',
      `New user registered: ${email}`,
      user.id,
      req
    );

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: user.toSafeObject(),
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      await Logger.logLogin(null, false, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      await Logger.logLogin(user.id, false, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log successful login
    await Logger.logLogin(user.id, true, req);

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({
      user: req.user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await Logger.logUserAction(
      'PASSWORD_CHANGED',
      `User ${user.email} changed their password`,
      user.id,
      req
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword
};