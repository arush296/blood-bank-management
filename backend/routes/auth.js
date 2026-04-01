const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateDonorRegistration, validateRecipientRegistration, handleValidationErrors } = require('../middleware/validation');

const setRoleFromRoute = (role) => (req, res, next) => {
	req.body.role = role;
	next();
};

router.post('/register/donor', setRoleFromRoute('donor'), validateDonorRegistration, handleValidationErrors, authController.register);
router.post('/register/recipient', setRoleFromRoute('recipient'), validateRecipientRegistration, handleValidationErrors, authController.register);
router.post('/register/admin', setRoleFromRoute('admin'), authController.register);
router.post('/login', authController.login);

module.exports = router;
