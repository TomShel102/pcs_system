import express from 'express';
import { login } from '../controllers/authController.js';
import { checkIn } from '../controllers/checkInController.js';
import { checkOut } from '../controllers/checkOutController.js';
import {
  getActiveParkingSessions,
  getDashboardSummary,
  getParkingLayout,
  getSlotSuggestion
} from '../controllers/dashboardController.js';
import {
  createMonthlyTicket,
  getMonthlyTicketByLicensePlate,
  renewMonthlyTicketByLicensePlate,
  getMonthlyTicketRenewalHistory
} from '../controllers/monthlyTicketController.js';
import { setSlotMaintenance, transferActiveSessionSlot } from '../controllers/parkingOpsController.js';
import { authenticateRequest, requireRole } from '../middlewares/authMiddleware.js';
import { getAppConfig } from '../utils/env.js';

const router = express.Router();
const appConfig = getAppConfig();
const protectedHandlers = appConfig.authEnforced
  ? [authenticateRequest, requireRole(['ADMIN', 'GUARD'])]
  : [];

router.post('/auth/login', login);
router.post('/check-in', ...protectedHandlers, checkIn);
router.post('/check-out', ...protectedHandlers, checkOut);
router.get('/dashboard-summary', ...protectedHandlers, getDashboardSummary);
router.get('/active-sessions', ...protectedHandlers, getActiveParkingSessions);
router.get('/parking-layout', ...protectedHandlers, getParkingLayout);
router.get('/slot-suggestion', ...protectedHandlers, getSlotSuggestion);
router.post('/monthly-tickets', ...protectedHandlers, createMonthlyTicket);
router.get('/monthly-tickets/:license_plate', ...protectedHandlers, getMonthlyTicketByLicensePlate);
router.put('/monthly-tickets/:license_plate/renew', ...protectedHandlers, renewMonthlyTicketByLicensePlate);
router.get('/monthly-tickets/:license_plate/renewals', ...protectedHandlers, getMonthlyTicketRenewalHistory);
router.put('/slots/:slot_code/maintenance', ...protectedHandlers, setSlotMaintenance);
router.put('/sessions/transfer-slot', ...protectedHandlers, transferActiveSessionSlot);

export default router;
