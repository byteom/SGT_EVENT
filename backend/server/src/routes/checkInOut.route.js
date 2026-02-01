import express from 'express';
const router = express.Router();
import checkInOutController from '../controllers/checkInOut.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

/**
 * CheckInOut Routes
 * All routes require authentication
 * Most routes are accessible by ADMIN, EVENT_MANAGER, and VOLUNTEER
 */

// 🔒 Apply authentication to all routes
router.use(authenticateToken);

// Get all records and stats (admin, event manager, volunteer)
router.get('/', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getAllRecords);
router.get('/stats', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getStats);
router.get('/active', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getActiveCheckIns);

// Get records by ID or entity (admin, event manager, volunteer)
router.get('/:id', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getRecordById);
router.get('/student/:studentId', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getRecordsByStudent);
router.get('/stall/:stallId', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getRecordsByStall);
router.get('/volunteer/:volunteerId', authorizeRoles('ADMIN', 'EVENT_MANAGER', 'VOLUNTEER'), checkInOutController.getRecordsByVolunteer);

// Delete record (admin only)
router.delete('/:id', authorizeRoles('ADMIN'), checkInOutController.deleteRecord);

export default router;
