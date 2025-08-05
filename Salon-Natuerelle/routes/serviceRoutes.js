const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');
const { isManager } = require('../middleware/roleMiddleware');
const { serviceValidation, generalValidation } = require('../middleware/validateInput');

// Public routes
router.get('/', generalValidation.pagination, serviceController.getAllServices);
router.get('/:id', generalValidation.idParam, serviceController.getService);

// Manager routes
router.post('/', authenticate, isManager, serviceValidation.create, serviceController.createService);
router.put('/:id', authenticate, isManager, serviceValidation.update, serviceController.updateService);
router.delete('/:id', authenticate, isManager, generalValidation.idParam, serviceController.deleteService);

module.exports = router;