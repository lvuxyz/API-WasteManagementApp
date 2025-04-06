const express = require('express');
const router = express.Router();
const wasteTypeController = require('../controllers/wasteTypeController');
const { isAuthenticated, restrictTo } = require('../middleware/authMiddleware');

// Base routes for waste types
router.get('/', wasteTypeController.getAllWasteTypes);
router.get('/:id', wasteTypeController.getWasteTypeById);

// Protected routes - only admin can create, update, delete
router.post('/', isAuthenticated, restrictTo('ADMIN'), wasteTypeController.createWasteType);
router.patch('/:id', isAuthenticated, restrictTo('ADMIN'), wasteTypeController.updateWasteType);
router.delete('/:id', isAuthenticated, restrictTo('ADMIN'), wasteTypeController.deleteWasteType);

// Routes for managing waste types at collection points
router.post('/collection-point', isAuthenticated, restrictTo('ADMIN'), wasteTypeController.addWasteTypeToCollectionPoint);
router.delete('/collection-point/:collection_point_id/:waste_type_id', isAuthenticated, restrictTo('ADMIN'), wasteTypeController.removeWasteTypeFromCollectionPoint);
router.get('/collection-point/:collection_point_id', wasteTypeController.getWasteTypesByCollectionPoint);
router.get('/:waste_type_id/collection-points', wasteTypeController.getCollectionPointsByWasteType);

module.exports = router; 