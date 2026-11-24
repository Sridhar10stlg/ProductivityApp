import { Router } from 'express';
import * as controller from './streaks.controller';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = Router();

// Configuration (editable from the Settings page)
router.get('/config', asyncHandler(controller.getConfig));
router.put('/settings', asyncHandler(controller.updateSettings));
router.put('/phases', asyncHandler(controller.replacePhases));
router.post('/habits', asyncHandler(controller.createHabit));
router.put('/habits/order', asyncHandler(controller.reorderHabits)); // before /habits/:id
router.put('/habits/:id', asyncHandler(controller.updateHabit));
router.delete('/habits/:id', asyncHandler(controller.removeHabit));

// Daily log
router.get('/days', asyncHandler(controller.listDays));
router.get('/days/:date', asyncHandler(controller.getDay));
router.put('/days/:date', asyncHandler(controller.saveDay));

// Reports
router.get('/summary', asyncHandler(controller.summary));
router.get('/weekly', asyncHandler(controller.weekly));

export { router as streaksRoutes };
