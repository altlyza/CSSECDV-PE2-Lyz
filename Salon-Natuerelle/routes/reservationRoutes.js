const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/authMiddleware');
const { reservationValidation, generalValidation } = require('../middleware/validateInput');

// All routes require authentication
router.use(authenticate);

router.post('/', reservationValidation.create, reservationController.createReservation);
router.get('/', generalValidation.pagination, reservationController.getReservations);
router.get('/:id', generalValidation.idParam, reservationController.getReservation);
router.put('/:id', reservationValidation.update, reservationController.updateReservation);
router.delete('/:id', generalValidation.idParam, reservationController.deleteReservation);

module.exports = router;