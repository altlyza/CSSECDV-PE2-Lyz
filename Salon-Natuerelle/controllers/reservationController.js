const { Reservation, Service, User } = require('../models');
const Logger = require('../utils/logger');
const { Op } = require('sequelize');

// Customer - Create reservation
const createReservation = async (req, res, next) => {
  try {
    const { serviceId, reservationDate, notes } = req.body;

    // Verify service exists and is active
    const service = await Service.findOne({
      where: { id: serviceId, isActive: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    // Check for conflicting reservations (same service at same time)
    const existingReservation = await Reservation.findOne({
      where: {
        serviceId,
        reservationDate,
        status: { [Op.not]: 'cancelled' }
      }
    });

    if (existingReservation) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const reservation = await Reservation.create({
      userId: req.user.id,
      serviceId,
      reservationDate,
      notes,
      status: 'pending'
    });

    // Log the action
    await Logger.logUserAction(
      'RESERVATION_CREATED',
      `Customer ${req.user.email} booked ${service.name} for ${reservationDate}`,
      req.user.id,
      req
    );

    // Fetch with associations
    const fullReservation = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Service },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: fullReservation
    });
  } catch (error) {
    next(error);
  }
};

// Get reservations (filtered by role)
const getReservations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Customers can only see their own reservations
    if (req.user.role === 'Customer') {
      whereClause.userId = req.user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.reservationDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: Service },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['reservationDate', 'ASC']]
    });

    res.json({
      reservations: rows,
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

// Get single reservation
const getReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: Service },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Customers can only view their own reservations
    if (req.user.role === 'Customer' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ reservation });
  } catch (error) {
    next(error);
  }
};

// Update reservation
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reservationDate, notes } = req.body;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Customers can only update their own reservations
    if (req.user.role === 'Customer' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Customers can only cancel their reservations
    if (req.user.role === 'Customer' && status && status !== 'cancelled') {
      return res.status(403).json({ error: 'Customers can only cancel reservations' });
    }

    // Update fields if provided
    if (status !== undefined) reservation.status = status;
    if (reservationDate !== undefined) reservation.reservationDate = reservationDate;
    if (notes !== undefined) reservation.notes = notes;

    await reservation.save();

    // Log the action
    await Logger.logUserAction(
      'RESERVATION_UPDATED',
      `${req.user.role} ${req.user.email} updated reservation ${id}`,
      req.user.id,
      req
    );

    // Fetch with associations
    const updatedReservation = await Reservation.findByPk(id, {
      include: [
        { model: Service },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      message: 'Reservation updated successfully',
      reservation: updatedReservation
    });
  } catch (error) {
    next(error);
  }
};

// Delete reservation (cancel)
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Customers can only delete their own reservations
    if (req.user.role === 'Customer' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set status to cancelled instead of hard delete
    reservation.status = 'cancelled';
    await reservation.save();

    // Log the action
    await Logger.logUserAction(
      'RESERVATION_CANCELLED',
      `${req.user.role} ${req.user.email} cancelled reservation ${id}`,
      req.user.id,
      req
    );

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  deleteReservation
};