const express = require('express');
const guestController = require('../controllers/guestController');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');
const adminManagementController = require('../controllers/adminManagementController');
const reportController = require('../controllers/reportController');
const { verifyAuth, requireRole } = require('../middlewares/authMiddleware');
const { uploadEventImages, uploadCsv } = require('../middlewares/uploadMiddleware');
const { loginLimiter, checkInLimiter } = require('../middlewares/rateLimiter');
const { ROLES } = require('../utils/roles');

const router = express.Router();

const requireManager = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
const requireCheckInAccess = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.VOLUNTEER);

router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyAuth, authController.logout);

router.get('/stats', verifyAuth, requireManager, guestController.getDashboardStats);
router.get('/guests', verifyAuth, requireManager, guestController.getAllGuests);
router.get('/guests/export', verifyAuth, requireManager, guestController.exportGuests);
router.post('/guests/import', verifyAuth, requireManager, uploadCsv.single('file'), guestController.importGuests);
router.get('/guests/event/:eventId', verifyAuth, requireManager, guestController.getGuestsByEvent);
router.get('/guests/:id/assets', verifyAuth, requireManager, guestController.getGuestAssets);
router.get('/guests/:id/qr', verifyAuth, requireManager, guestController.getAdminGuestQrAsset);
router.get('/guests/:id/invitation', verifyAuth, requireManager, guestController.getAdminGuestInvitationAsset);
router.patch('/guests/:id/attendance', verifyAuth, requireManager, guestController.updateGuestAttendance);
router.put('/guests/:id', verifyAuth, requireManager, guestController.updateGuest);
router.delete('/guests/:id', verifyAuth, requireManager, guestController.deleteGuest);

// Reports & analytics (manager+)
router.get('/reports/registration', verifyAuth, requireManager, reportController.registrationReport);
router.get('/reports/registration/export', verifyAuth, requireManager, reportController.registrationExport);
router.get('/reports/attendance', verifyAuth, requireManager, reportController.attendanceReport);
router.get('/reports/attendance/export', verifyAuth, requireManager, reportController.attendanceExport);
router.get('/reports/invitation-status', verifyAuth, requireManager, reportController.invitationStatusReport);
router.get('/reports/invitation-status/export', verifyAuth, requireManager, reportController.invitationStatusExport);

// Admin account management (super_admin only)
router.get('/admins', verifyAuth, requireSuperAdmin, adminManagementController.listAdmins);
router.post('/admins', verifyAuth, requireSuperAdmin, adminManagementController.createAdmin);
router.get('/admins/:id', verifyAuth, requireSuperAdmin, adminManagementController.getAdmin);
router.put('/admins/:id', verifyAuth, requireSuperAdmin, adminManagementController.updateAdmin);
router.post('/admins/:id/reset-password', verifyAuth, requireSuperAdmin, adminManagementController.resetPassword);
router.delete('/admins/:id', verifyAuth, requireSuperAdmin, adminManagementController.deleteAdmin);

const eventAdminRouter = express.Router();
eventAdminRouter.use(verifyAuth, requireManager);

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

// Volunteer read-only views (check-in roles): list events + guests for the
// volunteer dashboard. Reuses existing controllers; no mutations exposed.
router.get('/volunteer/events', verifyAuth, requireCheckInAccess, eventController.getAllEvents);
router.get('/volunteer/guests', verifyAuth, requireCheckInAccess, guestController.getAllGuests);

router.get('/registration-qr', verifyAuth, requireCheckInAccess, eventController.getRegistrationQr);
router.post('/check-in', verifyAuth, requireCheckInAccess, checkInLimiter, guestController.checkIn);

module.exports = router;
