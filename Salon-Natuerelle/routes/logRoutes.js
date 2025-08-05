const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { generalValidation } = require('../middleware/validateInput');

// Admin only routes
router.use(authenticate, isAdmin);

router.get('/', generalValidation.pagination, logController.getLogs);
router.get('/stats', logController.getLogStats);

module.exports = router;