import CheckInOut from '../models/CheckInOut.model.js';
import Student from '../models/Student.model.js';
import Stall from '../models/Stall.model.js';
import Volunteer from '../models/Volunteer.model.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import { query } from '../config/db.js';

/**
 * CheckInOut Controller
 * Handles check-in/out records and history
 */

/**
 * Get all check-in/out records (admin only)
 * @route GET /api/check-in-out
 */
const getAllRecords = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const records = await CheckInOut.findAll();
    
    // Enrich with student, stall, and volunteer details
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const [student, stall, volunteer] = await Promise.all([
          Student.findById(record.student_id, query),
          record.stall_id ? Stall.findById(record.stall_id, query) : null,
          record.volunteer_id ? Volunteer.findById(record.volunteer_id, query) : null
        ]);

        return {
          ...record,
          student_name: student ? student.full_name : 'Unknown',
          student_registration_no: student ? student.registration_no : null,
          stall_name: stall ? stall.stall_name : 'Unknown',
          stall_number: stall ? stall.stall_number : null,
          volunteer_name: volunteer ? volunteer.full_name : null
        };
      })
    );

    return successResponse(res, enrichedRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * Get check-in/out record by ID
 * @route GET /api/check-in-out/:id
 */
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await CheckInOut.findById(id);

    if (!record) {
      return errorResponse(res, 'Record not found', 404);
    }

    // Enrich with details
    const [student, stall, volunteer] = await Promise.all([
      Student.findById(record.student_id, query),
      record.stall_id ? Stall.findById(record.stall_id, query) : null,
      record.volunteer_id ? Volunteer.findById(record.volunteer_id, query) : null
    ]);

    return successResponse(res, {
      ...record,
      student: student ? {
        name: student.full_name,
        registration_no: student.registration_no,
        school_name: student.school_name
      } : null,
      stall: stall ? {
        stall_name: stall.stall_name,
        stall_number: stall.stall_number,
        school_name: stall.school_name
      } : null,
      volunteer: volunteer ? {
        name: volunteer.full_name
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get records by student ID
 * @route GET /api/check-in-out/student/:studentId
 */
const getRecordsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const records = await CheckInOut.findByStudentId(studentId, query);

    // Enrich with stall details
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const stall = record.stall_id ? await Stall.findById(record.stall_id, query) : null;
        return {
          ...record,
          stall_name: stall ? stall.stall_name : 'Unknown',
          stall_number: stall ? stall.stall_number : null
        };
      })
    );

    return successResponse(res, enrichedRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * Get records by stall ID
 * @route GET /api/check-in-out/stall/:stallId
 */
const getRecordsByStall = async (req, res, next) => {
  try {
    const { stallId } = req.params;
    const records = await CheckInOut.findByStallId(stallId, query);

    // Enrich with student details
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const student = await Student.findById(record.student_id, query);
        return {
          ...record,
          student_name: student ? student.full_name : 'Unknown',
          student_registration_no: student ? student.registration_no : null
        };
      })
    );

    return successResponse(res, enrichedRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * Get records by volunteer ID
 * @route GET /api/check-in-out/volunteer/:volunteerId
 */
const getRecordsByVolunteer = async (req, res, next) => {
  try {
    const { volunteerId } = req.params;
    const records = await CheckInOut.findByVolunteerId(volunteerId, query);

    // Enrich with student and stall details
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const [student, stall] = await Promise.all([
          Student.findById(record.student_id, query),
          record.stall_id ? Stall.findById(record.stall_id, query) : null
        ]);
        return {
          ...record,
          student_name: student ? student.full_name : 'Unknown',
          student_registration_no: student ? student.registration_no : null,
          stall_name: stall ? stall.stall_name : 'Unknown',
          stall_number: stall ? stall.stall_number : null
        };
      })
    );

    return successResponse(res, enrichedRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active check-ins (not checked out yet)
 * @route GET /api/check-in-out/active
 */
const getActiveCheckIns = async (req, res, next) => {
  try {
    const allRecords = await CheckInOut.findAll();
    // Filter for CHECKIN records that don't have a corresponding CHECKOUT
    const activeRecords = allRecords.filter(record => record.scan_type === 'CHECKIN');

    // Enrich with details
    const enrichedRecords = await Promise.all(
      activeRecords.map(async (record) => {
        const [student, stall] = await Promise.all([
          Student.findById(record.student_id, query),
          record.stall_id ? Stall.findById(record.stall_id, query) : null
        ]);
        return {
          ...record,
          student_name: student ? student.full_name : 'Unknown',
          student_registration_no: student ? student.registration_no : null,
          stall_name: stall ? stall.stall_name : 'Unknown',
          stall_number: stall ? stall.stall_number : null
        };
      })
    );

    return successResponse(res, enrichedRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * Get check-in statistics
 * @route GET /api/check-in-out/stats
 */
const getStats = async (req, res, next) => {
  try {
    const records = await CheckInOut.findAll();
    
    const totalCheckIns = records.filter(r => r.scan_type === 'CHECKIN').length;
    const totalCheckOuts = records.filter(r => r.scan_type === 'CHECKOUT').length;
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.scanned_at);
      const today = new Date();
      return recordDate.toDateString() === today.toDateString();
    });

    // Calculate average duration for checkout records with duration
    const durations = records
      .filter(r => r.scan_type === 'CHECKOUT' && r.duration_minutes)
      .map(r => r.duration_minutes);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return successResponse(res, {
      total_records: records.length,
      total_check_ins: totalCheckIns,
      total_check_outs: totalCheckOuts,
      today_records: todayRecords.length,
      average_duration_minutes: parseFloat(avgDuration.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete check-in record (admin only)
 * @route DELETE /api/check-in-out/:id
 */
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await CheckInOut.delete(id);
    if (!deleted) {
      return errorResponse(res, 'Record not found', 404);
    }

    return successResponse(res, null, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getAllRecords,
  getRecordById,
  getRecordsByStudent,
  getRecordsByStall,
  getRecordsByVolunteer,
  getActiveCheckIns,
  getStats,
  deleteRecord
};
