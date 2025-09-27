const express = require('express');
const { 
  addHistory, 
  getHistory, 
  deleteHistoryItem, 
  clearHistory 
} = require('../controllers/historyController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// All history routes require authentication
router.use(auth);

// POST /api/history - Add or update reading history
router.post('/', addHistory);

// GET /api/history - Get user's reading history
router.get('/', getHistory);

// DELETE /api/history/:mangaId/:chapter - Delete specific history entry
router.delete('/:mangaId/:chapter', deleteHistoryItem);

// DELETE /api/history - Clear all history
router.delete('/', clearHistory);

module.exports = router;
