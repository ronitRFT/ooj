const express = require('express');
const guestController = require('../controllers/guestController');
const { registerLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, guestController.registerGuest);
router.get('/uuid/:uuid/success', guestController.getGuestSuccessByUuid);
router.get('/uuid/:uuid', guestController.getGuestByUuid);

module.exports = router;
