const express = require('express');
const guestController = require('../controllers/guestController');
const { registerLimiter } = require('../middlewares/rateLimiter');
const { validateUuidParam } = require('../middlewares/validateUuid');

const router = express.Router();

router.post('/register', registerLimiter, guestController.registerGuest);
router.get('/uuid/:uuid/success', validateUuidParam, guestController.getGuestSuccessByUuid);
router.get('/uuid/:uuid', validateUuidParam, guestController.getGuestByUuid);
router.get('/uuid/:uuid/qr', validateUuidParam, guestController.getGuestQrAsset);
router.get('/uuid/:uuid/invitation', validateUuidParam, guestController.getGuestInvitationAsset);

module.exports = router;
