const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin, isManager } = require('../middleware/roleMiddleware');
const { userValidation, generalValidation } = require('../middleware/validateInput');

// Admin routes
router.post('/staff', authenticate, isAdmin, userValidation.register, userController.registerStaff);
router.delete('/:id', authenticate, isAdmin, generalValidation.idParam, userController.deleteUser);
router.put('/:id/role', authenticate, isAdmin, generalValidation.idParam, userController.changeUserRole);
router.get('/', authenticate, isAdmin, generalValidation.pagination, userController.getAllUsers);

// Manager routes
router.get('/customers', authenticate, isManager, generalValidation.pagination, userController.getAllCustomers);

module.exports = router;