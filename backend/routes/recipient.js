const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateBloodRequest, handleValidationErrors } = require('../middleware/validation');

router.get('/profile/:id', authenticateToken, recipientController.getRecipientProfile);
router.get('/profile/user/:user_id', authenticateToken, recipientController.getRecipientProfileByUserId);
router.post('/request', authenticateToken, authorizeRole('recipient'), validateBloodRequest, handleValidationErrors, recipientController.createBloodRequest);
router.get('/request/:id', authenticateToken, recipientController.getBloodRequestStatus);
router.get('/request/search/all', authenticateToken, recipientController.searchBloodRequests);
router.get('/:recipient_id/request-history', authenticateToken, recipientController.getRequestHistory);
router.get('/request-history/user/:user_id', authenticateToken, recipientController.getRequestHistoryByUserId);

module.exports = router;
