import { Router } from 'express';
import * as controller from './transaction.controller';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = Router();

// Summary routes must be defined BEFORE /:id
router.get('/summary/daily', asyncHandler(controller.dailyTotals));
router.get('/summary/monthly', asyncHandler(controller.monthlySummary));
router.get('/summary/yearly', asyncHandler(controller.yearlySummary));
router.get('/summary/category', asyncHandler(controller.categorySummary));

// CRUD routes
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

export { router as transactionRoutes };
