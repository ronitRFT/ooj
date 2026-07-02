const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.get('/active', eventController.getActiveEvent);
router.get('/registration-qr', eventController.getRegistrationQr);
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

module.exports = router;
