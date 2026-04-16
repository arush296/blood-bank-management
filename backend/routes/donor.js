const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/profile/:id', authenticateToken, donorController.getDonorProfile);
router.get('/profile/user/:user_id', authenticateToken, donorController.getDonorProfileByUserId);
router.put('/profile/:id', authenticateToken, authorizeRole('donor'), donorController.updateDonorProfile);
router.get('/notifications/my', authenticateToken, authorizeRole('donor'), donorController.getMyNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, authorizeRole('donor'), donorController.markNotificationRead);
router.put('/notifications/read-all', authenticateToken, authorizeRole('donor'), donorController.markAllNotificationsRead);
router.get('/search', authenticateToken, donorController.searchDonors);
router.post('/:donor_id/donation', authenticateToken, authorizeRole('admin'), donorController.recordDonation);
router.get('/:id/history', authenticateToken, donorController.getDonationHistory);
router.get('/history/user/:user_id', authenticateToken, donorController.getDonationHistoryByUserId);

module.exports = router;
