import Student from '../models/Student.model.js';
import CheckInOut from '../models/CheckInOut.model.js';
import Stall from '../models/Stall.model.js';
import Feedback from '../models/Feedback.model.js';
import Ranking from '../models/Ranking.model.js';
import StudentEventRanking from '../models/StudentEventRanking.model.js';
import EventModel from '../models/Event.model.js';
import EventRegistrationModel from '../models/EventRegistration.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCodeService from '../services/qrCode.js';
import PaymentService from '../services/payment.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import { setAuthCookie, clearAuthCookie } from '../helpers/cookie.js';
import { query } from '../config/db.js';

/**
 * Student Controller
 * Handles student authentication, profile, and QR code operations
 */

/**
 * Student login
 * @route POST /api/student/login
 */
const login = async (req, res, next) => {
  try {
    const { registration_no, password } = req.body;

    // Registration number and password are required
    if (!registration_no || !password) {
      return errorResponse(res, 'Registration number and password are required', 400);
    }

    // Find student by registration number only
    const student = await Student.findByRegistrationNo(registration_no, query);

    if (!student) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Verify password using model method
    const isValidPassword = await student.comparePassword(password);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if password reset is required (first-time login or admin-forced reset)
    if (student.password_reset_required) {
      return successResponse(res, {
        requires_password_reset: true,
        registration_no: student.registration_no,
        message: 'Please reset your password to continue'
      }, 'Password reset required');
    }

    const token = jwt.sign(
      { 
        id: student.id, 
        registration_no: student.registration_no, 
        role: student.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-Only cookie
    setAuthCookie(res, token);

    return successResponse(res, {
      token,
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        registration_no: student.registration_no,
        school_name: student.school_name,
        phone: student.phone,
        program_name: student.program_name,
        batch: student.batch
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get student profile
 * @route GET /api/student/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id, query);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      registration_no: student.registration_no,
      school_name: student.school_name,
      phone: student.phone,
      created_at: student.created_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student logout
 * @route POST /api/student/logout
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get student QR code
 * @route GET /api/student/qr-code
 */
const getQRCode = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id, query);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Generate rotating token (JWT string ~140 chars)
    const token = QRCodeService.generateRotatingStudentToken(student);
    
    // Generate rotating QR code image (Base64 PNG)
    const qrCodeImage = await QRCodeService.generateRotatingQRCodeImage(student);

    // Calculate rotation metadata for frontend
    const rotationInfo = {
      expires_in_seconds: QRCodeService.getSecondsUntilRotation(),
      rotation_interval: QRCodeService.ROTATION_INTERVAL_SECONDS,
      grace_period_seconds: QRCodeService.GRACE_PERIOD_WINDOWS * QRCodeService.ROTATION_INTERVAL_SECONDS
    };

    return successResponse(res, {
      qr_code: qrCodeImage,
      qr_code_token: token,
      registration_no: student.registration_no,
      rotation_info: rotationInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event-specific QR code for a registered event
 * @route GET /api/student/events/:eventId/qr-code
 * @description
 * Generates an event-specific QR code for students to use for check-in/check-out
 * at that particular event. This replaces the global QR code system.
 */
const getEventQRCode = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Find student
    const student = await Student.findById(req.user.id, query);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Verify student is registered for this event
    const registration = await EventRegistrationModel.findByEventAndStudent(eventId, student.id);
    if (!registration) {
      return errorResponse(res, 'You are not registered for this event', 403);
    }

    // For paid events, verify payment is completed
    if (registration.registration_type === 'PAID' && registration.payment_status !== 'COMPLETED') {
      return errorResponse(res, 'Payment pending for this event', 402);
    }

    // Get event details
    const event = await EventModel.findById(eventId);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Generate rotating token (JWT string ~140 chars) with event context
    const token = QRCodeService.generateRotatingStudentToken(student);
    
    // Generate rotating QR code image (Base64 PNG)
    const qrCodeImage = await QRCodeService.generateRotatingQRCodeImage(student);

    // Calculate rotation metadata for frontend
    const rotationInfo = {
      expires_in_seconds: QRCodeService.getSecondsUntilRotation(),
      rotation_interval: QRCodeService.ROTATION_INTERVAL_SECONDS,
      grace_period_seconds: QRCodeService.GRACE_PERIOD_WINDOWS * QRCodeService.ROTATION_INTERVAL_SECONDS
    };

    return successResponse(res, {
      qr_code: qrCodeImage,
      qr_code_token: token,
      registration_no: student.registration_no,
      event: {
        id: event.id,
        event_name: event.event_name,
        event_code: event.event_code,
        venue: event.venue,
        start_date: event.start_date,
        end_date: event.end_date
      },
      rotation_info: rotationInfo
    }, 'Event QR code generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get student check-in history
 * @route GET /api/student/check-in-history
 */
const getCheckInHistory = async (req, res, next) => {
  try {
    const history = await CheckInOut.findByStudentId(req.user.id, query);
    return successResponse(res, history);
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile
 * @route PUT /api/student/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const updateData = {};

    if (email) {
      updateData.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const updatedStudent = await Student.update(req.user.id, updateData, query);
    if (!updatedStudent) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, {
      id: updatedStudent.id,
      full_name: updatedStudent.full_name,
      email: updatedStudent.email,
      registration_no: updatedStudent.registration_no,
      school_name: updatedStudent.school_name
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Scan stall QR code (Student self-service)
 * @route POST /api/student/scan-stall
 */
const scanStall = async (req, res, next) => {
  try {
    const { stall_qr_token } = req.body;

    if (!stall_qr_token) {
      return errorResponse(res, 'Stall QR code is required', 400);
    }

    // Verify stall QR code
    const stallDecoded = QRCodeService.verifyStallQRToken(stall_qr_token);
    if (!stallDecoded || !stallDecoded.valid) {
      return errorResponse(res, 'Invalid stall QR code', 400);
    }

    // Find stall by QR token
    const stall = await Stall.findByQRToken(stall_qr_token, query);
    if (!stall) {
      return errorResponse(res, 'Stall not found', 404);
    }

    // Check if student is inside event
    const student = await Student.findById(req.user.id, query);
    
    
    if (!student) {
      return errorResponse(res, 'Student not found. Please login again.', 404);
    }
    
    if (!student.is_inside_event) {
      return errorResponse(res, 'You must be checked in at the event to scan stalls', 403);
    }

    // Get current event from active check-in
    const activeCheckInResult = await query(
      `SELECT event_id FROM check_in_outs 
       WHERE student_id = $1 AND scan_type = 'CHECKIN' 
       ORDER BY scanned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!activeCheckInResult || activeCheckInResult.length === 0) {
      return errorResponse(res, 'No active check-in found. Please check in first.', 403);
    }

    let currentEventId = activeCheckInResult[0].event_id;

    // If event_id is NULL in check_in record (legacy data), use the stall's event_id
    // This is safe because student is already verified as inside the event
    if (!currentEventId) {
      console.log('[SCAN-STALL] Check-in event_id is NULL, using stall event_id as fallback');
      currentEventId = stall.event_id;
    }

    // Validate stall belongs to current event (convert both to string for proper UUID comparison)
    const stallEventId = stall.event_id ? String(stall.event_id) : null;
    const checkedInEventId = currentEventId ? String(currentEventId) : null;
    
    console.log('[SCAN-STALL] Stall event_id:', stallEventId);
    console.log('[SCAN-STALL] Student checked-in event_id:', checkedInEventId);
    
    if (stallEventId !== checkedInEventId) {
      return errorResponse(res, 'This stall does not belong to your current checked-in event', 403);
    }

    // Check if student already gave feedback to this stall in this event
    const existingFeedbackQuery = await query(
      `SELECT * FROM feedbacks WHERE student_id = $1 AND stall_id = $2 AND event_id = $3`,
      [req.user.id, stall.id, currentEventId]
    );
    const existingFeedback = existingFeedbackQuery.length > 0 ? existingFeedbackQuery[0] : null;
    
    return successResponse(res, {
      stall: {
        id: stall.id,
        stall_number: stall.stall_number,
        stall_name: stall.stall_name,
        school_name: stall.school_name,
        description: stall.description,
        location: stall.location
      },
      already_reviewed: !!existingFeedback,
      existing_feedback: existingFeedback ? {
        rating: existingFeedback.rating,
        comment: existingFeedback.comment,
        submitted_at: existingFeedback.submitted_at
      } : null
    }, 'Stall scanned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Submit feedback for a stall
 * @route POST /api/student/submit-feedback
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { stall_id, rating, comment } = req.body;

    // Validation
    if (!stall_id || !rating) {
      return errorResponse(res, 'Stall ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    // Check if student is inside event
    const student = await Student.findById(req.user.id, query);
    
    // console.log(' [SUBMIT-FEEDBACK] JWT user ID:', req.user.id);
    // console.log('[SUBMIT-FEEDBACK] JWT user data:', req.user);
    // console.log('[SUBMIT-FEEDBACK] Student found:', student ? student.full_name : 'NULL');
    
    if (!student) {
      return errorResponse(res, 'Student not found. Please login again.', 404);
    }
    
    if (!student.is_inside_event) {
      return errorResponse(res, 'You must be checked in at the event to submit feedback', 403);
    }

    // Get current event from active check-in
    const activeCheckInResult = await query(
      `SELECT event_id FROM check_in_outs 
       WHERE student_id = $1 AND scan_type = 'CHECKIN' 
       ORDER BY scanned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!activeCheckInResult || activeCheckInResult.length === 0) {
      return errorResponse(res, 'No active check-in found. Please check in first.', 403);
    }

    // Check if stall exists first (we need it for fallback event_id)
    const stall = await Stall.findById(stall_id, query);
    if (!stall) {
      return errorResponse(res, 'Stall not found', 404);
    }

    // Get current event ID, fallback to stall's event_id if NULL (legacy data)
    let currentEventId = activeCheckInResult[0].event_id;
    if (!currentEventId) {
      console.log('[SUBMIT-FEEDBACK] Check-in event_id is NULL, using stall event_id as fallback');
      currentEventId = stall.event_id;
    }

    // Get stall count for current event (dynamic limit)
    const stallCount = await Stall.countByEvent(currentEventId, query);

    // Check feedback limit (max = number of stalls in current event)
    const feedbackCount = await Feedback.countByStudentAndEvent(req.user.id, currentEventId, query);
    if (feedbackCount >= stallCount) {
      return errorResponse(
        res, 
        `You have reached the maximum feedback limit for this event (${stallCount} stalls)`, 
        403
      );
    }

    // Validate stall belongs to current event (convert both to string for proper UUID comparison)
    const stallEventId = stall.event_id ? String(stall.event_id) : null;
    const checkedInEventId = currentEventId ? String(currentEventId) : null;
    
    if (stallEventId !== checkedInEventId) {
      return errorResponse(res, 'This stall does not belong to your current checked-in event', 403);
    }

    // Check if already gave feedback to this stall
    const existingFeedback = await Feedback.findByStudentAndStall(req.user.id, stall_id, query);
    if (existingFeedback) {
      return errorResponse(res, 'You have already submitted feedback for this stall', 409);
    }

    // Create feedback with event_id
    const feedback = await Feedback.create({
      student_id: req.user.id,
      stall_id: stall_id,
      rating: rating,
      comment: comment || null,
      event_id: currentEventId
    }, query);

    // Increment student's feedback count
    await Student.incrementFeedbackCount(req.user.id, query);

    // Increment stall's feedback count
    await query(
      'UPDATE stalls SET total_feedback_count = total_feedback_count + 1 WHERE id = $1',
      [stall_id]
    );

    return successResponse(res, {
      feedback: {
        id: feedback.id,
        stall_name: stall.stall_name,
        stall_number: stall.stall_number,
        rating: feedback.rating,
        comment: feedback.comment,
        submitted_at: feedback.submitted_at
      },
      event_stats: {
        total_stalls_in_event: stallCount,
        feedbacks_given_in_event: feedbackCount + 1,
        remaining_feedbacks_in_event: stallCount - (feedbackCount + 1)
      }
    }, 'Feedback submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's stall visits and feedback history
 * @route GET /api/student/my-visits
 */
const getMyVisits = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1) Count distinct events where student was checked in (by volunteer)
    const checkInQuery = `
      SELECT DISTINCT event_id 
      FROM check_in_outs 
      WHERE student_id = $1 AND scan_type = 'CHECKIN'
    `;
    const checkInResults = await query(checkInQuery, [studentId]);
    const totalEventVisits = checkInResults.length;

    // 2) Count total feedbacks given (across all events)
    const totalFeedbacksQuery = `
      SELECT COUNT(*) as count 
      FROM feedbacks 
      WHERE student_id = $1
    `;
    const feedbackResults = await query(totalFeedbacksQuery, [studentId]);
    const totalFeedbacks = parseInt(feedbackResults[0]?.count) || 0;

    // 3) Get detailed visit information for each event checked into
    const visitsQuery = `
      SELECT DISTINCT ON (c.event_id)
        c.event_id,
        e.event_name,
        e.start_date,
        e.end_date,
        c.scanned_at as check_in_time,
        (
          SELECT COUNT(*) 
          FROM feedbacks f 
          WHERE f.student_id = c.student_id 
            AND f.event_id = c.event_id
        ) as feedback_count
      FROM check_in_outs c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.student_id = $1 AND c.scan_type = 'CHECKIN'
      ORDER BY c.event_id, c.scanned_at DESC
    `;
    const visitsResults = await query(visitsQuery, [studentId]);

    // Build array of event visits
    const visits = visitsResults.map(visit => ({
      event_id: visit.event_id,
      event_name: visit.event_name,
      check_in_time: visit.check_in_time,
      start_date: visit.start_date,
      end_date: visit.end_date,
      feedback_count: parseInt(visit.feedback_count) || 0
    }));

    return successResponse(res, {
      total_event_visits: totalEventVisits, // number of events checked into
      total_feedbacks: totalFeedbacks, // total feedbacks given across all events
      visits // list of events visited with check-in time and feedback counts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's school stalls for ranking (Category 2)
 * @route GET /api/student/my-school-stalls
 */
const getMySchoolStalls = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id, query);
    
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Get current event from active check-in
    const activeCheckInResult = await query(
      `SELECT event_id FROM check_in_outs 
       WHERE student_id = $1 AND scan_type = 'CHECKIN' 
       ORDER BY scanned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!activeCheckInResult || activeCheckInResult.length === 0) {
      return errorResponse(res, 'You must be checked in to view school stalls', 403);
    }

    let currentEventId = activeCheckInResult[0].event_id;
    
    // If event_id is NULL in check_in record (legacy data), try multiple fallbacks
    if (!currentEventId) {
      console.log('[MY-SCHOOL-STALLS] Check-in event_id is NULL, trying fallbacks...');
      
      // Fallback 1: Try feedbacks table FIRST (most reliable - student already gave feedback)
      const feedbackResult = await query(
        `SELECT event_id FROM feedbacks 
         WHERE student_id = $1 AND event_id IS NOT NULL 
         ORDER BY submitted_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (feedbackResult.length > 0) {
        currentEventId = feedbackResult[0].event_id;
        console.log('[MY-SCHOOL-STALLS] Found event_id from feedbacks:', currentEventId);
      }
      
      // Fallback 2: Try stalls table (via school)
      if (!currentEventId) {
        const stallResult = await query(
          `SELECT DISTINCT s.event_id FROM stalls s
           WHERE s.school_id = $1 AND s.event_id IS NOT NULL AND s.is_active = true
           LIMIT 1`,
          [student.school_id]
        );
        if (stallResult.length > 0) {
          currentEventId = stallResult[0].event_id;
          console.log('[MY-SCHOOL-STALLS] Found event_id from stalls:', currentEventId);
        }
      }
      
      // Fallback 3: Try event_registrations
      if (!currentEventId) {
        const registrationResult = await query(
          `SELECT event_id FROM event_registrations 
           WHERE student_id = $1 AND registration_status = 'CONFIRMED' 
           ORDER BY registered_at DESC LIMIT 1`,
          [req.user.id]
        );
        if (registrationResult.length > 0) {
          currentEventId = registrationResult[0].event_id;
          console.log('[MY-SCHOOL-STALLS] Found event_id from event_registrations:', currentEventId);
        }
      }
    }

    if (!currentEventId) {
      return errorResponse(res, 'Unable to determine your current event. Please contact support.', 403);
    }

    // Check if student has already completed ranking for THIS event
    const rankingCompletionCheck = await query(
      `SELECT has_completed_ranking FROM student_event_rankings 
       WHERE student_id = $1 AND event_id = $2`,
      [req.user.id, currentEventId]
    );

    if (rankingCompletionCheck.length > 0 && rankingCompletionCheck[0].has_completed_ranking) {
      return errorResponse(res, 'You have already submitted your school stall rankings for this event', 409);
    }

    // Get ONLY school stalls where student gave feedback
    // First, let's debug - check how many feedbacks student has given
    const feedbackDebug = await query(
      `SELECT f.id, f.stall_id, f.event_id, s.stall_name, s.school_id, s.event_id as stall_event_id
       FROM feedbacks f 
       LEFT JOIN stalls s ON f.stall_id = s.id
       WHERE f.student_id = $1`,
      [req.user.id]
    );
    console.log('[MY-SCHOOL-STALLS] Student feedbacks:', JSON.stringify(feedbackDebug, null, 2));
    console.log('[MY-SCHOOL-STALLS] Current event_id:', currentEventId);
    console.log('[MY-SCHOOL-STALLS] Student school_id:', student.school_id);

    // Get ALL stalls where student gave feedback for this event (removed school restriction)
    const queryText = `
      SELECT 
        st.id as stall_id,
        st.stall_number,
        st.stall_name,
        st.description,
        st.location,
        sc.school_name,
        f.rating as my_rating,
        f.comment as my_comment,
        f.submitted_at as feedback_submitted_at
      FROM stalls st
      INNER JOIN schools sc ON st.school_id = sc.id
      INNER JOIN feedbacks f ON st.id = f.stall_id 
        AND f.student_id = $1 
        AND (f.event_id = $2 OR f.event_id IS NULL)
      WHERE st.event_id = $2 
        AND st.is_active = true
      ORDER BY st.stall_number ASC
    `;

    const stalls = await query(queryText, [req.user.id, currentEventId]);

    // Require minimum 3 feedbacks to enable ranking
    if (stalls.length < 3) {
      return errorResponse(
        res, 
        `You need to submit feedback to at least 3 stalls. Currently: ${stalls.length}/3. Please give feedback first.`, 
        400
      );
    }

    return successResponse(res, {
      student_info: {
        id: student.id,
        registration_no: student.registration_no,
        full_name: student.full_name,
        school_name: student.school_name
      },
      stalls: stalls.map(s => ({
        stall_id: s.stall_id,
        stall_number: s.stall_number,
        stall_name: s.stall_name,
        description: s.description,
        location: s.location,
        my_feedback: {
          rating: s.my_rating,
          comment: s.my_comment,
          submitted_at: s.feedback_submitted_at
        }
      })),
      total_stalls_with_feedback: stalls.length,
      instructions: 'Select top 3 stalls from YOUR SCHOOL that you have already reviewed. Ranks: 1 (best), 2 (second), 3 (third). ONE-TIME submission.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit school stall rankings (Category 2 - ONE-TIME only)
 * @route POST /api/student/submit-school-ranking
 */
const submitSchoolRanking = async (req, res, next) => {
  try {
    const { rankings } = req.body; // [{ stall_id, rank }]

    if (!Array.isArray(rankings) || rankings.length !== 3) {
      return errorResponse(res, 'Must provide exactly 3 stall rankings', 400);
    }

    const ranks = rankings.map(r => r.rank).sort();
    if (ranks.join(',') !== '1,2,3') {
      return errorResponse(res, 'Rankings must be exactly 1, 2, and 3 (no duplicates)', 400);
    }

    const stallIds = rankings.map(r => r.stall_id);
    if (new Set(stallIds).size !== 3) {
      return errorResponse(res, 'Must rank 3 different stalls', 400);
    }

    const student = await Student.findById(req.user.id, query);
    
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Get current event from active check-in
    const activeCheckInResult = await query(
      `SELECT event_id FROM check_in_outs 
       WHERE student_id = $1 AND scan_type = 'CHECKIN' 
       ORDER BY scanned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!activeCheckInResult || activeCheckInResult.length === 0) {
      return errorResponse(res, 'You must be checked in to submit rankings', 403);
    }

    const currentEventId = activeCheckInResult[0].event_id;

    // Check if student has already completed ranking for THIS event
    const rankingCompletionCheck = await query(
      `SELECT has_completed_ranking FROM student_event_rankings 
       WHERE student_id = $1 AND event_id = $2`,
      [req.user.id, currentEventId]
    );

    if (rankingCompletionCheck.length > 0 && rankingCompletionCheck[0].has_completed_ranking) {
      return errorResponse(res, 'You have already submitted your rankings for this event. This is ONE-TIME per event.', 409);
    }

    // Verify stalls belong to school, event, AND student gave feedback
    const stallValidationQuery = `
      SELECT 
        st.id, 
        st.stall_name, 
        st.school_id, 
        st.event_id,
        f.id as feedback_id,
        f.rating as feedback_rating
      FROM stalls st
      LEFT JOIN feedbacks f ON st.id = f.stall_id 
        AND f.student_id = $1 
        AND f.event_id = $2
      WHERE st.id = ANY($3::uuid[])
    `;
    
    const stallsToRank = await query(stallValidationQuery, [req.user.id, currentEventId, stallIds]);

    if (stallsToRank.length !== 3) {
      return errorResponse(res, 'One or more stalls not found', 404);
    }

    // Check feedback exists for all ranked stalls
    const stallsWithoutFeedback = stallsToRank.filter(s => !s.feedback_id);
    if (stallsWithoutFeedback.length > 0) {
      return errorResponse(
        res, 
        `You can only rank stalls you have already given feedback to. Missing feedback for: ${stallsWithoutFeedback.map(s => s.stall_name).join(', ')}`, 
        403
      );
    }

    const invalidStalls = stallsToRank.filter(s => s.school_id !== student.school_id);
    if (invalidStalls.length > 0) {
      return errorResponse(res, `You can only rank stalls from YOUR school. Invalid: ${invalidStalls.map(s => s.stall_name).join(', ')}`, 403);
    }

    // Verify all stalls belong to current event
    const wrongEventStalls = stallsToRank.filter(s => s.event_id !== currentEventId);
    if (wrongEventStalls.length > 0) {
      return errorResponse(res, `All stalls must be from your current event. Invalid: ${wrongEventStalls.map(s => s.stall_name).join(', ')}`, 403);
    }

    try {
      await query('BEGIN');

      const rankingData = rankings.map(r => ({
        student_id: req.user.id,
        stall_id: r.stall_id,
        rank: r.rank,
        event_id: currentEventId
      }));

      await Ranking.bulkCreate(rankingData, query);

      // Record per-event ranking completion
      await query(
        `INSERT INTO student_event_rankings (student_id, event_id, has_completed_ranking, completed_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (student_id, event_id) 
         DO UPDATE SET has_completed_ranking = true, completed_at = NOW()`,
        [req.user.id, currentEventId]
      );

      // Update global flag and category if first time ranking
      await query(
        `UPDATE students 
         SET has_completed_ranking = true,
             selected_category = 'CATEGORY_2',
             updated_at = NOW()
         WHERE id = $1 AND has_completed_ranking = false`,
        [req.user.id]
      );

      for (const ranking of rankings) {
        const columnName = ranking.rank === 1 ? 'rank_1_votes' 
                         : ranking.rank === 2 ? 'rank_2_votes' 
                         : 'rank_3_votes';
        
        await query(
          `UPDATE stalls 
           SET ${columnName} = ${columnName} + 1,
               weighted_score = (rank_1_votes * 5) + (rank_2_votes * 3) + (rank_3_votes * 1),
               updated_at = NOW()
           WHERE id = $1`,
          [ranking.stall_id]
        );
      }

      await query('COMMIT');

      const rankedStallsQuery = `
        SELECT r.rank, st.stall_name, st.stall_number
        FROM rankings r
        LEFT JOIN stalls st ON r.stall_id = st.id
        WHERE r.student_id = $1 AND r.event_id = $2
        ORDER BY r.rank ASC
      `;
      
      const rankedStalls = await query(rankedStallsQuery, [req.user.id, currentEventId]);

      return successResponse(res, {
        message: '🎉 Rankings submitted successfully!',
        submitted_rankings: rankedStalls.map(r => ({
          rank: r.rank,
          stall_name: r.stall_name,
          stall_number: r.stall_number
        })),
        note: 'Your rankings are recorded and cannot be changed.'
      }, 'School rankings submitted', 201);

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Get student's submitted school ranking (view only)
 * @route GET /api/student/my-school-ranking
 */
const getMySchoolRanking = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id, query);
    
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Get current event from active check-in
    const activeCheckInResult = await query(
      `SELECT event_id FROM check_in_outs 
       WHERE student_id = $1 AND scan_type = 'CHECKIN' 
       ORDER BY scanned_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!activeCheckInResult || activeCheckInResult.length === 0) {
      return errorResponse(res, 'You must be checked in to view your rankings', 403);
    }

    const currentEventId = activeCheckInResult[0].event_id;

    // Check if student has completed ranking for THIS event
    const rankingCompletionCheck = await query(
      `SELECT has_completed_ranking FROM student_event_rankings 
       WHERE student_id = $1 AND event_id = $2`,
      [req.user.id, currentEventId]
    );

    if (rankingCompletionCheck.length === 0 || !rankingCompletionCheck[0].has_completed_ranking) {
      return errorResponse(res, 'No rankings submitted for this event yet', 404);
    }

    const queryText = `
      SELECT 
        r.rank,
        r.submitted_at,
        st.stall_name,
        st.stall_number,
        st.description
      FROM rankings r
      LEFT JOIN stalls st ON r.stall_id = st.id
      WHERE r.student_id = $1 AND r.event_id = $2
      ORDER BY r.rank ASC
    `;

    const rankings = await query(queryText, [req.user.id, currentEventId]);

    return successResponse(res, {
      rankings: rankings.map(r => ({
        rank: r.rank,
        stall_name: r.stall_name,
        stall_number: r.stall_number,
        description: r.description
      })),
      submitted_at: rankings[0].submitted_at,
      note: 'This ranking was ONE-TIME and cannot be changed.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify reset credentials - Step 1 of password reset
 * Validates DOB and pincode before allowing password reset
 * @route POST /api/student/verify-reset-credentials
 */
const verifyResetCredentials = async (req, res, next) => {
  try {
    const { registration_no, date_of_birth, pincode } = req.body;

    // Validate required fields
    if (!registration_no || !date_of_birth || !pincode) {
      return errorResponse(res, 'Registration number, date of birth, and pincode are required', 400);
    }

    // Validate pincode format using model validation method
    if (!Student.isValidPincode(pincode)) {
      return errorResponse(res, 'Pincode must be exactly 6 digits', 400);
    }

    // Validate date of birth format and age using model validation method
    if (!Student.isValidDateOfBirth(date_of_birth)) {
      return errorResponse(res, 'Invalid date of birth format or age requirement not met', 400);
    }

    // Debug: Log the input values
    console.log('🔍 Verify Reset Credentials Input:', {
      registration_no,
      date_of_birth,
      pincode,
      pincode_type: typeof pincode,
      dob_type: typeof date_of_birth
    });

    // Verify credentials match
    const student = await Student.verifyResetCredentials(
      registration_no,
      date_of_birth,
      pincode,
      query
    );

    console.log('🔍 Query Result:', student ? 'Found student' : 'No match');

    if (!student) {
      return errorResponse(res, 'Invalid credentials. Please check your details.', 401);
    }

    // Generate temporary reset token (valid for 10 minutes)
    const resetToken = jwt.sign(
      { 
        id: student.id, 
        registration_no: student.registration_no,
        purpose: 'password_reset' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return successResponse(res, {
      reset_token: resetToken,
      registration_no: student.registration_no,
      full_name: student.full_name,
      expires_in: '10 minutes'
    }, 'Credentials verified successfully');
  } catch (error) {
    console.error('❌ Error in verifyResetCredentials:', error.message);
    console.error('Stack:', error.stack);
    next(error);
  }
};

/**
 * Reset password - Step 2 of password reset
 * Updates password using the reset token
 * @route POST /api/student/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    // Validate required fields
    if (!reset_token || !new_password || !confirm_password) {
      return errorResponse(res, 'Reset token and passwords are required', 400);
    }

    // Validate passwords match
    if (new_password !== confirm_password) {
      return errorResponse(res, 'Passwords do not match', 400);
    }

    // Validate password strength using model validation method
    if (!Student.isValidPassword(new_password)) {
      return errorResponse(res, 'Password must be at least 8 characters with at least one letter and one number', 400);
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'password_reset') {
        return errorResponse(res, 'Invalid reset token', 401);
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Reset token has expired. Please verify credentials again.', 401);
      }
      return errorResponse(res, 'Invalid reset token', 401);
    }

    // Reset password
    const updatedStudent = await Student.resetPassword(decoded.id, new_password, query);

    if (!updatedStudent) {
      return errorResponse(res, 'Failed to reset password', 500);
    }

    // Generate new auth token
    const authToken = jwt.sign(
      { 
        id: updatedStudent.id, 
        registration_no: updatedStudent.registration_no, 
        email: updatedStudent.email,
        role: updatedStudent.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-Only cookie
    setAuthCookie(res, authToken);

    return successResponse(res, {
      token: authToken,
      student: {
        id: updatedStudent.id,
        full_name: updatedStudent.full_name,
        registration_no: updatedStudent.registration_no,
        email: updatedStudent.email
      }
    }, 'Password reset successful. You are now logged in.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get available events (free and paid)
 * @route GET /api/student/events
 */
const getAvailableEvents = async (req, res, next) => {
  try {
    const { event_type, event_category, search, page, limit, exclude_registered } = req.query;
    const studentId = req.user.id; // Get logged-in student ID

    const result = await EventModel.getVisibleEvents({
      event_type,
      event_category,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      upcoming_only: true
    });

    // Add registration status for each event
    const eventsWithRegistration = await Promise.all(
      result.data.map(async (event) => {
        const registration = await EventRegistrationModel.getByStudentAndEvent(
          event.id,
          studentId
        );
        
        // Only mark as registered if status is CONFIRMED (not CANCELLED or PENDING)
        const isConfirmedRegistration = registration && 
          registration.registration_status === 'CONFIRMED' &&
          registration.payment_status !== 'PENDING';
        
        return {
          ...event,
          is_registered: isConfirmedRegistration,
          registration_status: registration ? registration.registration_status : null,
          payment_status: registration ? registration.payment_status : null
        };
      })
    );

    // Filter out registered events if requested
    const filteredEvents = exclude_registered === 'true' 
      ? eventsWithRegistration.filter(e => !e.is_registered)
      : eventsWithRegistration;

    return successResponse(res, {
      data: filteredEvents,
      pagination: result.pagination
    }, 'Events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single event details
 * @route GET /api/student/events/:eventId
 */
const getEventDetails = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const event = await EventModel.findById(eventId);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check if student is already registered
    const registration = await EventRegistrationModel.findByEventAndStudent(
      eventId,
      studentId
    );

    // Only mark as registered if status is CONFIRMED (not CANCELLED or PENDING)
    const isConfirmedRegistration = registration && 
      registration.registration_status === 'CONFIRMED' &&
      registration.payment_status !== 'PENDING';

    // Check registration status
    const registrationStatus = await EventModel.isRegistrationOpen(eventId);

    return successResponse(res, {
      event: {
        ...event,
        is_registered: isConfirmedRegistration,
        registration_status: registration ? registration.registration_status : null,
        payment_status: registration ? registration.payment_status : null
      },
      is_registered: isConfirmedRegistration,
      registration: registration || null,
      registration_open: registrationStatus.open,
      registration_message: registrationStatus.reason || 'Registration is open'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register for free event
 * @route POST /api/student/events/:eventId/register
 */
const registerForFreeEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    // Get event details
    const event = await EventModel.findById(eventId);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check if event is free
    if (event.event_type !== 'FREE') {
      return errorResponse(res, 'This is a paid event. Use payment endpoint.', 400);
    }

    // Check registration status
    const registrationStatus = await EventModel.isRegistrationOpen(eventId);
    if (!registrationStatus.open) {
      return errorResponse(res, registrationStatus.reason, 400);
    }

    // Check if already registered
    const existing = await EventRegistrationModel.findByEventAndStudent(
      eventId,
      studentId
    );
    if (existing) {
      return errorResponse(res, 'You are already registered for this event', 400);
    }

    // ✅ CRITICAL: Check event capacity before registration
    if (event.max_capacity && event.current_registrations >= event.max_capacity) {
      if (event.waitlist_enabled) {
        console.log(`⚠️ [REGISTRATION] Event full, waitlist enabled: ${event.event_name}`);
        return errorResponse(res, 
          `Event is full (${event.max_capacity} capacity reached). Waitlist feature coming soon.`, 
          400
        );
      } else {
        console.log(`❌ [REGISTRATION] Event full, no waitlist: ${event.event_name}`);
        return errorResponse(res, 
          `Event is full. Registration closed. Capacity: ${event.max_capacity}`, 
          400
        );
      }
    }

    console.log(`✅ [REGISTRATION] Capacity check passed: ${event.current_registrations}/${event.max_capacity || 'unlimited'}`);

    // Create registration
    const registration = await EventRegistrationModel.createFreeRegistration(
      eventId,
      studentId
    );

    return successResponse(
      res,
      { registration },
      'Successfully registered for the event',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate payment for paid event
 * @route POST /api/student/events/:eventId/payment/initiate
 */
const initiatePaidEventPayment = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    // Get event details
    const event = await EventModel.findById(eventId);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check if event is paid
    if (event.event_type !== 'PAID') {
      return errorResponse(res, 'This is a free event. Use free registration endpoint.', 400);
    }

    // Check registration status
    const registrationStatus = await EventModel.isRegistrationOpen(eventId);
    if (!registrationStatus.open) {
      return errorResponse(res, registrationStatus.reason, 400);
    }

    // Check if already registered
    const existing = await EventRegistrationModel.findByEventAndStudent(
      eventId,
      studentId
    );
    if (existing && existing.payment_status === 'COMPLETED') {
      return errorResponse(res, 'You are already registered for this event', 400);
    }

    // ✅ CRITICAL: Check event capacity before payment initiation
    if (event.max_capacity && event.current_registrations >= event.max_capacity) {
      if (event.waitlist_enabled) {
        console.log(`⚠️ [PAYMENT] Event full, waitlist enabled: ${event.event_name}`);
        return errorResponse(res, 
          `Event is full (${event.max_capacity} capacity reached). Waitlist feature coming soon.`, 
          400
        );
      } else {
        console.log(`❌ [PAYMENT] Event full, no waitlist: ${event.event_name}`);
        return errorResponse(res, 
          `Event is full. Registration closed. Capacity: ${event.max_capacity}`, 
          400
        );
      }
    }

    console.log(`✅ [PAYMENT] Capacity check passed: ${event.current_registrations}/${event.max_capacity || 'unlimited'}`);

    // Get student details
    const student = await Student.findById(studentId, query);

    // Create Razorpay order
    const order = await PaymentService.createOrder({
      amount: event.price,
      currency: event.currency,
      event_id: eventId,
      student_id: studentId,
      event_code: event.event_code
    });

    // Create or update registration record
    let registration;
    if (existing && existing.payment_status === 'PENDING') {
      // Update existing pending registration
      registration = await EventRegistrationModel.completePayment(existing.id, {
        razorpay_payment_id: null,
        razorpay_signature: null
      });
    } else {
      // Create new registration
      registration = await EventRegistrationModel.createPaidRegistration(
        eventId,
        studentId,
        {
          amount: event.price,
          currency: event.currency,
          razorpay_order_id: order.order_id
        }
      );
    }

    return successResponse(
      res,
      {
        order,
        registration_id: registration.id,
        razorpay_key: PaymentService.getPublicKey(),
        student: {
          name: student.full_name,
          email: student.email,
          contact: student.phone
        },
        event: {
          name: event.event_name,
          code: event.event_code
        }
      },
      'Payment order created successfully',
      201
    );
  } catch (error) {
    console.error('Payment initiation error:', error);
    next(error);
  }
};

/**
 * Verify payment and complete registration
 * @route POST /api/student/events/:eventId/payment/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const studentId = req.user.id;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(res, 'Invalid payment data', 400);
    }

    // Verify signature (skip in development with mock signatures)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isMockSignature = razorpay_signature.includes('mock') || razorpay_signature.includes('test');
    
    let isValid = false;
    if (isDevelopment && isMockSignature) {
      console.log('⚠️  [DEV MODE] Accepting mock signature for testing');
      isValid = true;
    } else {
      isValid = PaymentService.verifyPaymentSignature({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature
      });
    }

    if (!isValid) {
      return errorResponse(res, 'Payment verification failed. Invalid signature.', 400);
    }

    // Find registration by order ID
    const registration = await EventRegistrationModel.findByOrderId(razorpay_order_id);
    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }

    // Verify ownership
    if (registration.student_id !== studentId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Complete payment
    const updated = await EventRegistrationModel.completePayment(registration.id, {
      razorpay_payment_id,
      razorpay_signature
    });

    return successResponse(
      res,
      { registration: updated },
      'Payment verified successfully. You are now registered for the event!'
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

/**
 * Check payment status from Razorpay API and complete registration if paid
 * This is a fallback when JavaScript callback doesn't work
 * @route POST /api/student/events/:eventId/payment/check-status
 */
const checkPaymentStatus = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { order_id } = req.body;
    const studentId = req.user.id;

    console.log(`🔍 [CHECK STATUS] Checking payment status for order: ${order_id}`);

    if (!order_id) {
      return errorResponse(res, 'Order ID is required', 400);
    }

    // Find registration by order ID
    const registration = await EventRegistrationModel.findByOrderId(order_id);
    if (!registration) {
      return errorResponse(res, 'Registration not found for this order', 404);
    }

    // Check ownership
    if (registration.student_id !== studentId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // If already completed, return success
    if (registration.payment_status === 'COMPLETED' && registration.registration_status === 'CONFIRMED') {
      console.log(`✅ [CHECK STATUS] Registration already confirmed`);
      return successResponse(res, { 
        status: 'completed',
        registration 
      }, 'Registration already confirmed!');
    }

    // Fetch order status from Razorpay API
    const orderDetails = await PaymentService.getOrderDetails(order_id);
    console.log(`📋 [CHECK STATUS] Razorpay order status:`, orderDetails);

    // Check if order is paid
    if (orderDetails.status === 'paid' || orderDetails.amount_due === 0) {
      console.log(`✅ [CHECK STATUS] Order is PAID! Completing registration...`);
      
      // Fetch payments for this order to get payment_id
      const razorpay = PaymentService.getRazorpayInstance();
      const payments = await razorpay.orders.fetchPayments(order_id);
      
      let paymentId = null;
      if (payments && payments.items && payments.items.length > 0) {
        // Get the successful payment
        const successfulPayment = payments.items.find(p => p.status === 'captured') || payments.items[0];
        paymentId = successfulPayment.id;
      }

      // Complete payment in database
      const updated = await EventRegistrationModel.completePayment(registration.id, {
        razorpay_payment_id: paymentId || 'verified_via_api',
        razorpay_signature: 'verified_via_order_status'
      });

      console.log(`✅ [CHECK STATUS] Registration completed successfully!`);

      return successResponse(res, { 
        status: 'completed',
        registration: updated 
      }, 'Payment verified! Registration complete.');
    }

    // Order not yet paid
    console.log(`⏳ [CHECK STATUS] Order not yet paid. Status: ${orderDetails.status}`);
    return successResponse(res, { 
      status: 'pending',
      order_status: orderDetails.status 
    }, 'Payment not yet completed');

  } catch (error) {
    console.error('Check payment status error:', error);
    next(error);
  }
};

/**
 * Get student's registered events
 * @route GET /api/student/my-events
 */
const getMyRegisteredEvents = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { status, payment_status } = req.query;

    const registrations = await EventRegistrationModel.getStudentRegistrations(
      studentId,
      { status, payment_status }
    );

    return successResponse(res, { registrations });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel event registration (deregister from event)
 * Simple version - shows refund info, cancels registration
 * User can re-register later by paying again
 * @route POST /api/student/events/:eventId/deregister
 */
const cancelEventRegistration = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { confirm_cancel } = req.body; // true to confirm cancellation
    const studentId = req.user.id;

    // Find registration
    const registration = await EventRegistrationModel.getByStudentAndEvent(eventId, studentId);
    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }

    // Check if already cancelled
    if (registration.registration_status === 'CANCELLED') {
      return errorResponse(res, 'Registration already cancelled', 400);
    }

    // Get event details
    const event = await EventModel.findById(eventId);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check if event already started
    if (new Date(event.start_date) < new Date()) {
      return errorResponse(res, 'Cannot cancel registration for events that have already started', 400);
    }

    // Calculate refund info for paid events
    let refundInfo = null;
    if (event.event_type === 'PAID' && registration.payment_status === 'COMPLETED') {
      const paidAmount = parseFloat(registration.amount_paid || event.price || 0);
      
      // Simple refund policy: 
      // - More than 7 days before: 100% refund
      // - 3-7 days before: 50% refund
      // - Less than 3 days: No refund
      const eventDate = new Date(event.start_date);
      const now = new Date();
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      
      let refundPercent = 0;
      let refundReason = '';
      
      if (daysUntilEvent > 7) {
        refundPercent = 100;
        refundReason = 'Full refund (more than 7 days before event)';
      } else if (daysUntilEvent >= 3) {
        refundPercent = 50;
        refundReason = '50% refund (3-7 days before event)';
      } else {
        refundPercent = 0;
        refundReason = 'No refund (less than 3 days before event)';
      }
      
      refundInfo = {
        paid_amount: paidAmount,
        refund_percent: refundPercent,
        refund_amount: (paidAmount * refundPercent) / 100,
        refund_reason: refundReason,
        days_until_event: daysUntilEvent
      };
    }

    // If not confirmed, just return refund info (preview)
    if (!confirm_cancel) {
      return successResponse(res, {
        preview: true,
        event_name: event.event_name,
        registration_status: registration.registration_status,
        payment_status: registration.payment_status,
        is_paid_event: event.event_type === 'PAID',
        refund_info: refundInfo,
        message: refundInfo 
          ? `If you cancel, you will receive a ${refundInfo.refund_percent}% refund (₹${refundInfo.refund_amount})`
          : 'This is a free event. You can cancel without any charges.'
      }, 'Review cancellation details');
    }

    // Confirmed - proceed with cancellation
    console.log(`📝 Cancelling registration ${registration.id} for student ${studentId}`);

    // Process refund if applicable
    let razorpayRefund = null;
    if (refundInfo && refundInfo.refund_amount > 0 && registration.razorpay_payment_id) {
      try {
        razorpayRefund = await PaymentService.processRefund({
          payment_id: registration.razorpay_payment_id,
          amount: refundInfo.refund_amount,
          notes: {
            reason: 'Student cancellation',
            student_id: studentId,
            event_id: eventId,
            refund_percent: refundInfo.refund_percent
          }
        });
        console.log(`✅ Refund processed: ${razorpayRefund.id}`);
      } catch (refundError) {
        console.error('Refund processing failed:', refundError);
        // Continue with cancellation even if refund fails
        // Admin can process refund manually
      }
    }

    // Update registration status to CANCELLED
    await query(
      `UPDATE event_registrations 
       SET registration_status = 'CANCELLED', 
           cancelled_at = NOW(),
           refund_amount = $1,
           refund_status = $2,
           razorpay_refund_id = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        refundInfo?.refund_amount || 0,
        razorpayRefund ? 'PROCESSED' : (refundInfo?.refund_amount > 0 ? 'PENDING' : 'NOT_APPLICABLE'),
        razorpayRefund?.id || null,
        registration.id
      ]
    );

    console.log(`✅ Registration cancelled successfully`);

    return successResponse(res, {
      cancelled: true,
      event_name: event.event_name,
      refund_info: refundInfo,
      razorpay_refund_id: razorpayRefund?.id || null,
      message: refundInfo && refundInfo.refund_amount > 0
        ? `Registration cancelled. Refund of ₹${refundInfo.refund_amount} will be processed within 5-7 business days.`
        : 'Registration cancelled successfully.'
    }, 'Registration cancelled');

  } catch (error) {
    console.error('Cancel registration error:', error);
    next(error);
  }
};

/**
 * ============================================
 * EVENT-SCOPED METHODS (New - Backward Compatible)
 * ============================================
 */

/**
 * Submit feedback for event-scoped operation
 * @route POST /api/student/events/:eventId/submit-feedback
 * Dynamic limit based on stall count in event
 */
const submitEventFeedback = async (req, res, next) => {
  try {
    const { stall_id, rating, comment } = req.body;
    const { eventId, user, activeCheckIn } = req;

    // Validation
    if (!stall_id || !rating) {
      return errorResponse(res, 'Stall ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    // Get dynamic feedback limit based on stall count in this event
    const stallCount = await Stall.countByEvent(eventId, query);
    if (stallCount === 0) {
      return errorResponse(res, 'No stalls found for this event', 404);
    }

    // Check feedback limit (max = stall count for this event)
    const feedbackCount = await Feedback.countByStudentAndEvent(user.id, eventId, query);
    if (feedbackCount >= stallCount) {
      return errorResponse(
        res, 
        `You have reached the maximum feedback limit for this event (${stallCount} stalls)`, 
        403
      );
    }

    // Check if stall exists and belongs to this event
    const stall = await Stall.findById(stall_id, query);
    if (!stall) {
      return errorResponse(res, 'Stall not found', 404);
    }

    if (stall.event_id !== eventId) {
      return errorResponse(res, 'This stall does not belong to the specified event', 403);
    }

    // Check if already gave feedback to this stall
    const existingFeedback = await Feedback.findByStudentAndStall(user.id, stall_id, query);
    if (existingFeedback) {
      return errorResponse(res, 'You have already submitted feedback for this stall', 409);
    }

    // Create feedback with event_id
    const feedback = await Feedback.create({
      student_id: user.id,
      stall_id: stall_id,
      rating: rating,
      comment: comment || null,
      event_id: eventId
    }, query);

    // Increment stall's feedback count
    await query(
      `UPDATE stalls 
       SET total_feedback_count = total_feedback_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [stall_id]
    );

    return successResponse(res, {
      feedback,
      event_stats: {
        event_id: eventId,
        your_feedbacks: feedbackCount + 1,
        max_feedbacks: stallCount,
        remaining: stallCount - feedbackCount - 1
      }
    }, 'Feedback submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's visits/feedbacks for specific event
 * @route GET /api/student/events/:eventId/my-visits
 */
const getEventVisits = async (req, res, next) => {
  try {
    const { eventId, user } = req;

    // Get all feedbacks for this event
    const feedbacks = await Feedback.getByStudentAndEvent(user.id, eventId, query);

    // Get stall count for this event
    const stallCount = await Stall.countByEvent(eventId, query);

    return successResponse(res, {
      event_id: eventId,
      feedbacks: feedbacks,
      stats: {
        total_feedbacks: feedbacks.length,
        max_allowed: stallCount,
        remaining: stallCount - feedbacks.length
      }
    }, 'Event visits retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Submit school ranking for specific event
 * @route POST /api/student/events/:eventId/submit-school-ranking
 * Per-event ranking completion tracking
 */
const submitEventRanking = async (req, res, next) => {
  try {
    const { rankings } = req.body; // [{ stall_id, rank }]
    const { eventId, user, activeCheckIn } = req;

    if (!Array.isArray(rankings) || rankings.length !== 3) {
      return errorResponse(res, 'Must provide exactly 3 stall rankings', 400);
    }

    const ranks = rankings.map(r => r.rank).sort();
    if (ranks.join(',') !== '1,2,3') {
      return errorResponse(res, 'Rankings must be exactly 1, 2, and 3 (no duplicates)', 400);
    }

    const stallIds = rankings.map(r => r.stall_id);
    if (new Set(stallIds).size !== 3) {
      return errorResponse(res, 'Must rank 3 different stalls', 400);
    }

    const student = await Student.findById(user.id, query);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Check if already completed ranking for THIS event
    const hasCompleted = await StudentEventRanking.hasCompleted(user.id, eventId, query);
    if (hasCompleted) {
      return errorResponse(res, 'You have already submitted your rankings for this event', 409);
    }

    // Verify ALL stalls belong to student's school AND this event
    const stallCheckQuery = `
      SELECT st.id, st.stall_name, st.school_id, st.event_id, sc.school_name
      FROM stalls st
      LEFT JOIN schools sc ON st.school_id = sc.id
      WHERE st.id = ANY($1::uuid[])
    `;
    
    const stallsToRank = await query(stallCheckQuery, [stallIds]);

    if (stallsToRank.length !== 3) {
      return errorResponse(res, 'One or more stalls not found', 404);
    }

    // Check event membership
    const wrongEventStalls = stallsToRank.filter(s => s.event_id !== eventId);
    if (wrongEventStalls.length > 0) {
      return errorResponse(
        res, 
        `All stalls must belong to this event. Invalid: ${wrongEventStalls.map(s => s.stall_name).join(', ')}`, 
        403
      );
    }

    // Check school membership
    const invalidStalls = stallsToRank.filter(s => s.school_id !== student.school_id);
    if (invalidStalls.length > 0) {
      return errorResponse(
        res, 
        `You can only rank stalls from YOUR school. Invalid: ${invalidStalls.map(s => s.stall_name).join(', ')}`, 
        403
      );
    }

    try {
      await query('BEGIN');

      const rankingData = rankings.map(r => ({
        student_id: user.id,
        stall_id: r.stall_id,
        rank: r.rank,
        event_id: eventId
      }));

      await Ranking.bulkCreate(rankingData, query);

      // Mark ranking as completed for this event
      await StudentEventRanking.markCompleted(user.id, eventId, query);

      // Update stall vote counts
      for (const ranking of rankings) {
        const columnName = ranking.rank === 1 ? 'rank_1_votes' 
                         : ranking.rank === 2 ? 'rank_2_votes' 
                         : 'rank_3_votes';
        
        await query(
          `UPDATE stalls 
           SET ${columnName} = ${columnName} + 1,
               weighted_score = (rank_1_votes * 3) + (rank_2_votes * 2) + (rank_3_votes * 1),
               updated_at = NOW()
           WHERE id = $1`,
          [ranking.stall_id]
        );
      }

      await query('COMMIT');

      return successResponse(res, {
        rankings: rankingData,
        event_id: eventId,
        message: 'Rankings submitted successfully for this event'
      }, 'School ranking submitted successfully');

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get event-specific statistics for student
 * @route GET /api/student/events/:eventId/stats
 */
const getEventStats = async (req, res, next) => {
  try {
    const { eventId, user } = req;

    // Get student's stats for this event
    const feedbackCount = await Feedback.countByStudentAndEvent(user.id, eventId, query);
    const stallCount = await Stall.countByEvent(eventId, query);
    const hasCompletedRanking = await StudentEventRanking.hasCompleted(user.id, eventId, query);
    const checkInHistory = await CheckInOut.getEventCheckInHistory(user.id, eventId, query);

    return successResponse(res, {
      event_id: eventId,
      feedbacks: {
        submitted: feedbackCount,
        max_allowed: stallCount,
        remaining: stallCount - feedbackCount
      },
      ranking: {
        completed: hasCompletedRanking
      },
      check_ins: {
        total: checkInHistory.length,
        history: checkInHistory
      }
    }, 'Event statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  logout,
  getProfile,
  getQRCode,
  getCheckInHistory,
  updateProfile,
  scanStall,
  submitFeedback,
  getMyVisits,
  getMySchoolStalls,
  submitSchoolRanking,
  getMySchoolRanking,
  verifyResetCredentials,
  resetPassword,
  // Event-related methods
  getAvailableEvents,
  getEventDetails,
  registerForFreeEvent,
  initiatePaidEventPayment,
  verifyPayment,
  checkPaymentStatus,
  getMyRegisteredEvents,
  cancelEventRegistration,
  getEventQRCode,
  // Event-scoped methods (NEW)
  submitEventFeedback,
  getEventVisits,
  submitEventRanking,
  getEventStats
};
