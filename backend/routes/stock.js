const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, stockController.getAllStock);
router.get('/:blood_group', authenticateToken, stockController.getStockByBloodGroup);
router.post('/add', authenticateToken, authorizeRole('admin'), stockController.addStock);
router.post('/reduce', authenticateToken, authorizeRole('admin'), stockController.reduceStock);
router.get('/warnings/expiry', authenticateToken, authorizeRole('admin'), stockController.getExpiryWarnings);
router.get('/alerts/low-stock', authenticateToken, authorizeRole('admin'), stockController.getLowStockAlerts);

module.exports = router;
