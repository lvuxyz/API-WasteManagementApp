const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Route cần quyền admin
router.post('/some-admin-route', auth, checkRole('ADMIN'), someController.adminAction);

module.exports = router; 