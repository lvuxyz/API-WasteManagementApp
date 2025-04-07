const express = require('express');
const router = express.Router();
const collectionPointController = require('../controllers/collectionPointController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes - anyone can view collection points
router.get('/', collectionPointController.getAllCollectionPoints);
router.get('/:id', collectionPointController.getCollectionPointById);

// Protected routes - only admin can create, update, delete collection points
router.post('/', authenticateUser, authorizeRoles('ADMIN'), collectionPointController.createCollectionPoint);
router.patch('/:id', authenticateUser, authorizeRoles('ADMIN'), collectionPointController.updateCollectionPoint);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN'), collectionPointController.deleteCollectionPoint);

// Status management routes
router.patch('/:id/status', authenticateUser, authorizeRoles('ADMIN'), collectionPointController.updateCollectionPointStatus);
router.get('/:id/status-history', collectionPointController.getCollectionPointStatusHistory);

module.exports = router; 