const express = require('express');
const guestController = require('../controllers/guestController');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');
const shareController = require('../controllers/shareController');
const { verifyAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', verifyAuth, authController.logout);

router.get('/stats', verifyAuth, guestController.getDashboardStats);
router.get('/guests', verifyAuth, guestController.getAllGuests);
router.get('/guests/event/:eventId', verifyAuth, guestController.getGuestsByEvent);
router.get('/events', verifyAuth, eventController.getAllEvents);
router.get('/registration-qr', verifyAuth, eventController.getRegistrationQr);
router.get('/share', verifyAuth, shareController.getShareInfo);
router.post('/share/email', verifyAuth, shareController.sendEmailInvite);
router.post('/events', verifyAuth, eventController.createEvent);
router.put('/events/:id', verifyAuth, eventController.updateEvent);

module.exports = router;
