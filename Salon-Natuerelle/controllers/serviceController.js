const { Service, User } = require('../models');
const Logger = require('../utils/logger');
const { Op } = require('sequelize');

// Manager only - Create service
const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration } = req.body;

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      createdBy: req.user.id
    });

    // Log the action
    await Logger.logUserAction(
      'SERVICE_CREATED',
      `Manager ${req.user.email} created service: ${name}`,
      req.user.id,
      req
    );

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

// Public - Get all active services
const getAllServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Service.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      services: rows,
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

// Public - Get single service
const getService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
};

// Manager only - Update service
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, isActive } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update fields if provided
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    // Log the action
    await Logger.logUserAction(
      'SERVICE_UPDATED',
      `Manager ${req.user.email} updated service: ${service.name}`,
      req.user.id,
      req
    );

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

// Manager only - Delete service (soft delete)
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();

    // Log the action
    await Logger.logUserAction(
      'SERVICE_DELETED',
      `Manager ${req.user.email} deleted service: ${service.name}`,
      req.user.id,
      req
    );

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getAllServices,
  getService,
  updateService,
  deleteService
};