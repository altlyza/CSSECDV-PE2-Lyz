const { Sequelize } = require('sequelize');
const { AuditLog, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Admin only - Get all logs
const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (action) {
      whereClause.action = action;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.timestamp[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['timestamp', 'DESC']]
    });

    res.json({
      logs: rows,
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

// Admin only - Get log statistics
const getLogStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('action')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    const recentActivity = await AuditLog.count({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    res.json({
      actionStats: stats,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  getLogStats
};