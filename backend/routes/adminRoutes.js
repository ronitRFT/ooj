const express = require('express');
const guestController = require('../controllers/guestController');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middlewares/authMiddleware');
const { uploadEventImages } = require('../middlewares/uploadMiddleware');
const { loginLimiter, checkInLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyAuth, authController.logout);

router.get('/stats', verifyAuth, guestController.getDashboardStats);
router.get('/guests', verifyAuth, guestController.getAllGuests);
router.get('/guests/event/:eventId', verifyAuth, guestController.getGuestsByEvent);
router.get('/guests/:id/assets', verifyAuth, guestController.getGuestAssets);
router.get('/guests/:id/qr', verifyAuth, guestController.getAdminGuestQrAsset);
router.get('/guests/:id/invitation', verifyAuth, guestController.getAdminGuestInvitationAsset);
router.patch('/guests/:id/attendance', verifyAuth, guestController.updateGuestAttendance);

const eventAdminRouter = express.Router();
eventAdminRouter.use(verifyAuth);

eventAdminRouter.get('/', eventController.getAllEvents);
eventAdminRouter.get('/:id', eventController.getEventById);
eventAdminRouter.post('/', uploadEventImages.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]), eventController.createEvent);
eventAdminRouter.put('/:id', uploadEventImages.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]), eventController.updateEvent);
eventAdminRouter.post('/:id/set-active', eventController.setActiveEvent);
eventAdminRouter.post('/:id/duplicate', eventController.duplicateEvent);
eventAdminRouter.post('/:id/archive', eventController.archiveEvent);
eventAdminRouter.delete('/:id', eventController.deleteEvent);

router.use('/events', eventAdminRouter);

router.get('/registration-qr', verifyAuth, eventController.getRegistrationQr);
router.post('/check-in', verifyAuth, checkInLimiter, guestController.checkIn);

module.exports = router;
