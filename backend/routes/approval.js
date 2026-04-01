const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('admin'), approvalController.createApproval);
router.put('/:id', authenticateToken, authorizeRole('admin'), approvalController.updateApprovalStatus);
router.get('/history/all', authenticateToken, authorizeRole('admin'), approvalController.getApprovalHistory);
router.post('/issue', authenticateToken, authorizeRole('admin'), approvalController.issueBlood);
router.get('/issues/history', authenticateToken, authorizeRole('admin'), approvalController.getIssueHistory);

module.exports = router;
