const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Get all transactions (admin only)
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), transactionController.getAllTransactions);

// Get user's transactions
router.get('/my-transactions', authenticateUser, transactionController.getUserTransactions);

// Get transaction by ID
router.get('/:id', authenticateUser, transactionController.getTransactionById);

// Create new transaction
router.post('/', authenticateUser, transactionController.createTransaction);

// Update transaction 
router.put('/:id', authenticateUser, transactionController.updateTransaction);

// Update transaction status
router.patch('/:id/status', authenticateUser, authorizeRoles(['ADMIN']), transactionController.updateTransactionStatus);

// Delete transaction
router.delete('/:id', authenticateUser, transactionController.deleteTransaction);

// Get transaction history
router.get('/:id/history', authenticateUser, transactionController.getTransactionHistory);

module.exports = router; 