const express = require('express');
const router = express.Router();
const wasteTypeController = require('../controllers/wasteTypeController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Base routes for waste types
router.get('/', wasteTypeController.getAllWasteTypes);
router.get('/:id', wasteTypeController.getWasteTypeById);

// Protected routes - only admin can create, update, delete
router.post('/', authenticateUser, authorizeRoles('ADMIN'), wasteTypeController.createWasteType);
router.patch('/:id', authenticateUser, authorizeRoles('ADMIN'), wasteTypeController.updateWasteType);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN'), wasteTypeController.deleteWasteType);

// Routes for managing waste types at collection points
router.post('/collection-point', authenticateUser, authorizeRoles('ADMIN'), wasteTypeController.addWasteTypeToCollectionPoint);
router.delete('/collection-point/:collection_point_id/:waste_type_id', authenticateUser, authorizeRoles('ADMIN'), wasteTypeController.removeWasteTypeFromCollectionPoint);
router.get('/collection-point/:collection_point_id', wasteTypeController.getWasteTypesByCollectionPoint);
router.get('/:waste_type_id/collection-points', wasteTypeController.getCollectionPointsByWasteType);

module.exports = router; 