const express = require('express');
const router = express.Router();
const collectionPointController = require('../controllers/collectionPointController');
const { isAuthenticated, restrictTo } = require('../middleware/authMiddleware');

// Public routes - anyone can view collection points
router.get('/', collectionPointController.getAllCollectionPoints);
router.get('/:id', collectionPointController.getCollectionPointById);

// Protected routes - only admin can create, update, delete collection points
router.post('/', isAuthenticated, restrictTo('ADMIN'), collectionPointController.createCollectionPoint);
router.patch('/:id', isAuthenticated, restrictTo('ADMIN'), collectionPointController.updateCollectionPoint);
router.delete('/:id', isAuthenticated, restrictTo('ADMIN'), collectionPointController.deleteCollectionPoint);

// Status management routes
router.patch('/:id/status', isAuthenticated, restrictTo('ADMIN'), collectionPointController.updateCollectionPointStatus);
router.get('/:id/status-history', collectionPointController.getCollectionPointStatusHistory);

module.exports = router; 