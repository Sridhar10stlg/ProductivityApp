import { Router } from 'express';
import * as controller from './account.controller';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

export { router as accountRoutes };
