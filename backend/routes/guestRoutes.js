const express = require('express');
const guestController = require('../controllers/guestController');

const router = express.Router();

router.post('/register', guestController.registerGuest);
router.post('/check-in', guestController.checkIn);
router.get('/uuid/:uuid', guestController.getGuestByUuid);

module.exports = router;
