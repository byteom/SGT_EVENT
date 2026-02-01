import express from 'express';
const router = express.Router();
import feedbackController from '../controllers/feedback.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

/**
 * Feedback Routes
 * Mix of authenticated and public routes
 */

// 🔓 Public routes - View feedback (no auth required)
router.get('/stall/:stallId', feedbackController.getFeedbackByStall);
router.get('/stall/:stallId/stats', feedbackController.getStallFeedbackStats);

// 🔒 Protected routes (require authentication)
router.use(authenticateToken);

// Student feedback management
router.post('/', authorizeRoles('STUDENT'), feedbackController.submitFeedback);
router.get('/my-feedback', authorizeRoles('STUDENT'), feedbackController.getMyFeedback);
router.put('/:id', authorizeRoles('STUDENT'), feedbackController.updateFeedback);
router.delete('/:id', authorizeRoles('STUDENT', 'ADMIN'), feedbackController.deleteFeedback);

// Admin/staff views
router.get('/student/:studentId', authorizeRoles('ADMIN', 'EVENT_MANAGER'), feedbackController.getFeedbackByStudent);

export default router;
