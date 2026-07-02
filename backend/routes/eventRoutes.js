const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

// Public: active event only (registration & landing pages)
router.get('/active', eventController.getActiveEvent);

module.exports = router;
