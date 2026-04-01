const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('donor'), applicationController.applyToRequest);
router.get('/my', authenticateToken, authorizeRole('donor'), applicationController.getMyApplications);
router.get('/request/:request_id', authenticateToken, authorizeRole('recipient', 'admin'), applicationController.getApplicationsForRequest);
router.put('/:id', authenticateToken, authorizeRole('admin'), applicationController.updateApplicationStatus);

module.exports = router;
