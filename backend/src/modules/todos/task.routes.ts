import { Router } from 'express';
import * as controller from './task.controller';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

const router = Router();

// Stats must come before /:id
router.get('/stats', asyncHandler(controller.stats));

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

// Sub-tasks
router.post('/:taskId/subtasks', asyncHandler(controller.createSubTask));
router.put('/:taskId/subtasks/:id', asyncHandler(controller.updateSubTask));
router.delete('/:taskId/subtasks/:id', asyncHandler(controller.deleteSubTask));

export { router as taskRoutes };
