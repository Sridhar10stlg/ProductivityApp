import { Router } from 'express';
import * as controller from './worklog.controller';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

export { router as worklogRoutes };
